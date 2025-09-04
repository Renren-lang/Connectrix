const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const jwt = require('jsonwebtoken');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts. Please try again later.'
);

const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many API requests. Please slow down.'
);

const strictRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  10, // 10 requests per window
  'Too many requests. Please wait before trying again.'
);

// Input validation and sanitization
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        sanitized[key] = validator.escape(value.trim());
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Email validation
const validateEmail = (email) => {
  return validator.isEmail(email) && email.length <= 254;
};

// Password validation
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  if (password.length > 128) return false;
  
  // Check for at least one uppercase, lowercase, number, and special character
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// Name validation
const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  if (name.length < 1 || name.length > 50) return false;
  // Only allow letters, spaces, hyphens, and apostrophes
  return /^[a-zA-Z\s\-']+$/.test(name);
};

// Input validation middleware
const validateInput = (req, res, next) => {
  const errors = [];

  // Validate email if present
  if (req.body.email && !validateEmail(req.body.email)) {
    errors.push('Invalid email format');
  }

  // Validate password if present
  if (req.body.password && !validatePassword(req.body.password)) {
    errors.push('Password must be 8-128 characters with uppercase, lowercase, number, and special character');
  }

  // Validate names if present
  if (req.body.firstName && !validateName(req.body.firstName)) {
    errors.push('Invalid first name format');
  }
  if (req.body.lastName && !validateName(req.body.lastName)) {
    errors.push('Invalid last name format');
  }

  // Validate role if present
  if (req.body.role && !['student', 'alumni'].includes(req.body.role)) {
    errors.push('Invalid role. Must be student or alumni');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.firebaseapp.com", "https://*.googleapis.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    // Log only in development or for errors
    if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
      console.log(`[API] ${logData.method} ${logData.url} - ${logData.status} (${logData.duration})`);
    }
  });

  next();
};

// IP whitelist middleware (optional)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.includes(clientIP)) {
      next();
    } else {
      res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not authorized',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error(`[ERROR] ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  sanitizeInput,
  validateInput,
  validateEmail,
  validatePassword,
  validateName,
  securityHeaders,
  requestLogger,
  ipWhitelist,
  errorHandler
};
