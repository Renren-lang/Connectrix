// Debug utilities for CONNECTRIX application

// Enable debug mode in development
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Debug logger
export const debugLog = (message, data = null) => {
  if (DEBUG_MODE) {
    if (data) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

// Error logger with context
export const debugError = (context, error, additionalData = null) => {
  if (DEBUG_MODE) {
    console.group(`[ERROR] ${context}`);
    console.error('Error:', error);
    if (additionalData) {
      console.error('Additional Data:', additionalData);
    }
    console.trace('Stack Trace:');
    console.groupEnd();
  }
};

// Firebase connection test
export const testFirebaseConnection = async () => {
  try {
    const { db } = await import('../firebase');
    const testDoc = await db.collection('_test').doc('connection-test').get();
    debugLog('Firebase connection successful');
    return true;
  } catch (error) {
    debugError('Firebase connection test failed', error);
    return false;
  }
};

// Auth state debug
export const debugAuthState = (user, userRole) => {
  debugLog('Auth State Changed', {
    user: user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    } : null,
    userRole,
    timestamp: new Date().toISOString()
  });
};

// Component render debug
export const debugComponentRender = (componentName, props = {}) => {
  debugLog(`Component ${componentName} rendered`, {
    props: Object.keys(props),
    timestamp: new Date().toISOString()
  });
};

// Performance debug
export const debugPerformance = (operation, startTime) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  debugLog(`Performance: ${operation} took ${duration.toFixed(2)}ms`);
};

// Network request debug
export const debugNetworkRequest = (url, method, status, duration) => {
  debugLog(`Network Request: ${method} ${url}`, {
    status,
    duration: `${duration.toFixed(2)}ms`,
    timestamp: new Date().toISOString()
  });
};

// Local storage debug
export const debugLocalStorage = (key, value, operation) => {
  debugLog(`LocalStorage ${operation}: ${key}`, {
    value: typeof value === 'object' ? JSON.stringify(value) : value,
    timestamp: new Date().toISOString()
  });
};

// Route change debug
export const debugRouteChange = (from, to) => {
  debugLog('Route Changed', {
    from,
    to,
    timestamp: new Date().toISOString()
  });
};

// Export debug mode for conditional debugging
export { DEBUG_MODE };
