// Production configuration for Connectrix API

module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: 'production',
  
  // CORS configuration for production
  cors: {
    origin: [
      "https://cconnect-7f562.web.app",
      "https://connectrix-app.web.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  // Rate limiting for production
  rateLimits: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: 'Too many authentication attempts. Please try again later.'
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many API requests. Please slow down.'
    },
    strict: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10, // 10 requests per window
      message: 'Too many requests. Please wait before trying again.'
    }
  },

  // Security headers for production
  security: {
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

  // Logging configuration
  logging: {
    level: 'error', // Only log errors in production
    enableRequestLogging: false, // Disable request logging in production
    enableDetailedErrors: false // Don't expose detailed errors in production
  }
};
