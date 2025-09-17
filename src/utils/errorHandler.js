// Comprehensive error handling utility for debugging 400 Bad Request errors

/**
 * Enhanced error handler for HTTP 400 Bad Request errors
 */
export class ErrorHandler {
  /**
   * Logs detailed error information for debugging
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   * @param {Object} additionalData - Additional data to log
   */
  static logError(error, context = 'Unknown', additionalData = {}) {
    console.group(`🚨 Error in ${context}`);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Stack:', error.stack);
    console.error('Context:', context);
    console.error('Additional Data:', additionalData);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  /**
   * Validates data before sending to Firestore
   * @param {Object} data - Data to validate
   * @param {string} operation - Operation being performed
   * @returns {Object} - Validated and sanitized data
   */
  static validateFirestoreData(data, operation = 'unknown') {
    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid data for ${operation}: must be an object`);
    }

    const validated = {};
    const maxStringLength = 1000;
    const maxArrayLength = 100;

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'string') {
        // Remove any control characters that might cause 400 errors
        validated[key] = value
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
          .trim()
          .substring(0, maxStringLength);
      } else if (Array.isArray(value)) {
        validated[key] = value
          .slice(0, maxArrayLength)
          .map(item => {
            if (typeof item === 'string') {
              return item
                .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
                .trim()
                .substring(0, 200);
            }
            return item;
          });
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        validated[key] = value;
      } else if (value instanceof Date) {
        validated[key] = value;
      } else if (typeof value === 'object' && value.constructor === Object) {
        // Recursively validate nested objects
        validated[key] = this.validateFirestoreData(value, `${operation}.${key}`);
      } else {
        // Convert other types to string and sanitize
        validated[key] = String(value)
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
          .trim()
          .substring(0, maxStringLength);
      }
    }

    // Remove any undefined or null values
    Object.keys(validated).forEach(key => {
      if (validated[key] === undefined || validated[key] === null) {
        delete validated[key];
      }
    });

    return validated;
  }

  /**
   * Checks if a request might be too large
   * @param {Object} data - Data to check
   * @returns {Object} - Size information and warnings
   */
  static checkRequestSize(data) {
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInKB / 1024;

    const warnings = [];
    if (sizeInMB > 1) {
      warnings.push('Request size exceeds 1MB - may cause 400 errors');
    }
    if (sizeInKB > 100) {
      warnings.push('Request size exceeds 100KB - consider reducing data');
    }

    return {
      sizeInBytes,
      sizeInKB: Math.round(sizeInKB * 100) / 100,
      sizeInMB: Math.round(sizeInMB * 100) / 100,
      warnings
    };
  }

  /**
   * Validates URL parameters
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      console.error('Invalid URL:', url, error);
      return false;
    }
  }

  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email is valid
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates Firebase document ID
   * @param {string} id - Document ID to validate
   * @returns {boolean} - Whether ID is valid
   */
  static validateDocumentId(id) {
    if (!id || typeof id !== 'string') {
      return false;
    }
    
    // Firebase document IDs cannot contain certain characters
    const invalidChars = /[\/\s]/;
    if (invalidChars.test(id)) {
      return false;
    }
    
    // Firebase document IDs have length limits
    if (id.length > 1500) {
      return false;
    }
    
    return true;
  }

  /**
   * Handles specific Firebase errors
   * @param {Error} error - Firebase error
   * @returns {string} - User-friendly error message
   */
  static handleFirebaseError(error) {
    const errorCode = error.code || error.message;
    
    switch (errorCode) {
      case 'permission-denied':
        return 'Permission denied. Please check your authentication status.';
      case 'not-found':
        return 'Document not found.';
      case 'already-exists':
        return 'Document already exists.';
      case 'invalid-argument':
        return 'Invalid data provided. Please check your input.';
      case 'failed-precondition':
        return 'Operation failed due to a precondition.';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again.';
      case 'unauthenticated':
        return 'Authentication required. Please log in again.';
      case 'resource-exhausted':
        return 'Request limit exceeded. Please try again later.';
      case 'deadline-exceeded':
        return 'Request timeout. Please try again.';
      default:
        return `Operation failed: ${error.message}`;
    }
  }

  /**
   * Creates a retry mechanism for failed requests
   * @param {Function} operation - Operation to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Initial delay in milliseconds
   * @returns {Promise} - Result of the operation
   */
  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry for certain error types
        if (error.code === 'permission-denied' || 
            error.code === 'not-found' || 
            error.code === 'invalid-argument' ||
            error.code === 'unauthenticated') {
          throw error;
        }
        
        if (i < maxRetries) {
          console.warn(`Operation failed, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Clears browser cache and cookies (for debugging)
   */
  static clearBrowserData() {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear cookies (if possible)
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
      
      console.log('Browser data cleared successfully');
    } catch (error) {
      console.error('Error clearing browser data:', error);
    }
  }
}

export default ErrorHandler;
