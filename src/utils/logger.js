// Safe logging utility to avoid console warnings
class SafeLogger {
  static log(message, data = null) {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      if (data) {
        console.log(`[Connectrix] ${message}:`, data);
      } else {
        console.log(`[Connectrix] ${message}`);
      }
    }
  }

  static error(message, error = null) {
    // Always log errors, but safely
    if (error) {
      console.error(`[Connectrix Error] ${message}:`, {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
    } else {
      console.error(`[Connectrix Error] ${message}`);
    }
  }

  static warn(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      if (data) {
        console.warn(`[Connectrix Warning] ${message}:`, data);
      } else {
        console.warn(`[Connectrix Warning] ${message}`);
      }
    }
  }

  static info(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      if (data) {
        console.info(`[Connectrix Info] ${message}:`, data);
      } else {
        console.info(`[Connectrix Info] ${message}`);
      }
    }
  }

  // Firebase specific logging
  static firebaseAuth(message, data = null) {
    this.log(`Firebase Auth: ${message}`, data);
  }

  static firebaseError(message, error = null) {
    this.error(`Firebase Error: ${message}`, error);
  }

  // User action logging
  static userAction(action, data = null) {
    this.log(`User Action: ${action}`, data);
  }

  // API logging
  static apiCall(endpoint, method = 'GET', data = null) {
    this.log(`API Call: ${method} ${endpoint}`, data);
  }

  static apiResponse(endpoint, status, data = null) {
    this.log(`API Response: ${endpoint} - ${status}`, data);
  }

  static apiError(endpoint, error = null) {
    this.error(`API Error: ${endpoint}`, error);
  }
}

export default SafeLogger;
