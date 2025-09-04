const admin = require('firebase-admin');

// Verify Firebase ID token middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid authorization header found',
        timestamp: new Date().toISOString()
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }

    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      role: decodedToken.role // This will be set when user registers
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please sign in again',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please sign in again',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token verification failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Check if user has specific role
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        });
      }

      // Get user role from Firestore
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(req.user.uid)
        .get();

      if (!userDoc.exists) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        });
      }

      const userData = userDoc.data();
      const userRole = userData.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          timestamp: new Date().toISOString()
        });
      }

      // Add role to user object
      req.user.role = userRole;
      next();
    } catch (error) {
      console.error('Role verification error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify user role',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Check if user owns the resource or has admin role
const requireOwnershipOrRole = (resourceUserIdField = 'userId', allowedRoles = ['admin']) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        });
      }

      // Get user role from Firestore
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(req.user.uid)
        .get();

      if (!userDoc.exists) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        });
      }

      const userData = userDoc.data();
      const userRole = userData.role;

      // Check if user has admin role
      if (allowedRoles.includes(userRole)) {
        req.user.role = userRole;
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (resourceUserId === req.user.uid) {
        req.user.role = userRole;
        return next();
      }

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. You can only access your own resources.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Ownership verification error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify resource ownership',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return next(); // No token, continue without user
    }

    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture
    };

    next();
  } catch (error) {
    // If token verification fails, continue without user
    console.warn('Optional auth failed:', error.message);
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  requireOwnershipOrRole,
  optionalAuth
};
