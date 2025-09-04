// Security configuration for Connectrix API

module.exports = {
  // Rate limiting configurations
  rateLimits: {
    // Authentication endpoints (strict)
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: 'Too many authentication attempts. Please try again later.'
    },
    
    // General API endpoints
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many API requests. Please slow down.'
    },
    
    // Strict endpoints (registration, password reset)
    strict: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10, // 10 requests per window
      message: 'Too many requests. Please wait before trying again.'
    }
  },

  // CORS configuration
  cors: {
    origin: [
      "http://localhost:3000",
      "https://cconnect-7f562.web.app",
      "https://connectrix-app.web.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // Input validation rules
  validation: {
    email: {
      maxLength: 254,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    name: {
      minLength: 1,
      maxLength: 50,
      pattern: /^[a-zA-Z\s\-']+$/
    },
    role: {
      allowed: ['student', 'alumni']
    }
  },

  // Security headers
  headers: {
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
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  },

  // IP whitelist (optional - leave empty to disable)
  ipWhitelist: [
    // Add trusted IP addresses here if needed
    // "192.168.1.0/24",
    // "10.0.0.0/8"
  ],

  // Environment-specific settings
  environment: {
    development: {
      logLevel: 'debug',
      enableDetailedErrors: true,
      enableRequestLogging: true
    },
    production: {
      logLevel: 'error',
      enableDetailedErrors: false,
      enableRequestLogging: false
    }
  }
};
