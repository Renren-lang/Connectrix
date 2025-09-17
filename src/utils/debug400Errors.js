// Debug utility for identifying and fixing 400 Bad Request errors

/**
 * Debug utility for 400 Bad Request errors
 */
export class Debug400Errors {
  /**
   * Monitors network requests for 400 errors
   */
  static startMonitoring() {
    // Override fetch to monitor requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (response.status === 400) {
          console.group('🚨 400 Bad Request Detected (Fetch)');
          console.error('URL:', args[0]);
          console.error('Method:', args[1]?.method || 'GET');
          console.error('Headers:', args[1]?.headers || {});
          console.error('Body:', args[1]?.body || 'No body');
          console.error('Status:', response.status);
          console.error('Status Text:', response.statusText);
          
          // Try to get response body
          try {
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            console.error('Response Body:', responseText);
            
            // Try to parse as JSON for better error details
            try {
              const responseJson = JSON.parse(responseText);
              console.error('Response JSON:', responseJson);
            } catch (parseError) {
              console.error('Response is not JSON');
            }
          } catch (e) {
            console.error('Could not read response body:', e);
          }
          
          // Log additional debugging info
          console.error('Timestamp:', new Date().toISOString());
          console.error('User Agent:', navigator.userAgent);
          console.error('Current URL:', window.location.href);
          
          console.groupEnd();
        }
        
        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    };

    // Monitor XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._method = method;
      this._url = url;
      return originalXHROpen.call(this, method, url, ...args);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      this.addEventListener('load', function() {
        if (this.status === 400) {
          console.group('🚨 400 Bad Request Detected (XHR)');
          console.error('Method:', this._method);
          console.error('URL:', this._url);
          console.error('Status:', this.status);
          console.error('Status Text:', this.statusText);
          console.error('Request Data:', data);
          console.error('Response:', this.responseText);
          
          // Try to parse response as JSON
          try {
            const responseJson = JSON.parse(this.responseText);
            console.error('Response JSON:', responseJson);
          } catch (parseError) {
            console.error('Response is not JSON');
          }
          
          // Log additional debugging info
          console.error('Timestamp:', new Date().toISOString());
          console.error('User Agent:', navigator.userAgent);
          console.error('Current URL:', window.location.href);
          
          console.groupEnd();
        }
      });
      
      return originalXHRSend.call(this, data);
    };

    // Add global error handler for unhandled errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && event.error.message.includes('400')) {
        console.group('🚨 400 Error Detected (Global)');
        console.error('Error:', event.error);
        console.error('Message:', event.message);
        console.error('Filename:', event.filename);
        console.error('Line:', event.lineno);
        console.error('Column:', event.colno);
        console.error('Timestamp:', new Date().toISOString());
        console.groupEnd();
      }
    });

    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('400')) {
        console.group('🚨 400 Error Detected (Promise Rejection)');
        console.error('Reason:', event.reason);
        console.error('Promise:', event.promise);
        console.error('Timestamp:', new Date().toISOString());
        console.groupEnd();
      }
    });

    console.log('🔍 400 Error monitoring started');
  }

  /**
   * Stops monitoring network requests
   */
  static stopMonitoring() {
    // Note: This is a simplified version. In a real implementation,
    // you'd want to store references to the original functions
    console.log('🛑 400 Error monitoring stopped');
  }

  /**
   * Validates form data before submission
   * @param {FormData} formData - Form data to validate
   * @returns {Object} - Validation results
   */
  static validateFormData(formData) {
    const issues = [];
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
      
      // Check for common issues
      if (typeof value === 'string') {
        if (value.length > 1000) {
          issues.push(`${key}: Value too long (${value.length} characters)`);
        }
        
        if (value.includes('\x00')) {
          issues.push(`${key}: Contains null characters`);
        }
        
        if (value.includes('\r') || value.includes('\n')) {
          issues.push(`${key}: Contains line breaks`);
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      data
    };
  }

  /**
   * Validates JSON data before sending
   * @param {Object} data - Data to validate
   * @returns {Object} - Validation results
   */
  static validateJsonData(data) {
    const issues = [];
    
    try {
      const jsonString = JSON.stringify(data);
      const sizeInBytes = new Blob([jsonString]).size;
      
      if (sizeInBytes > 1024 * 1024) { // 1MB
        issues.push(`Data too large: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Check for circular references
      const seen = new WeakSet();
      const checkCircular = (obj, path = '') => {
        if (obj && typeof obj === 'object') {
          if (seen.has(obj)) {
            issues.push(`Circular reference found at ${path}`);
            return;
          }
          seen.add(obj);
          
          for (const [key, value] of Object.entries(obj)) {
            checkCircular(value, `${path}.${key}`);
          }
          
          seen.delete(obj);
        }
      };
      
      checkCircular(data);
      
    } catch (error) {
      issues.push(`JSON serialization error: ${error.message}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      data
    };
  }

  /**
   * Checks for common 400 error causes
   * @param {Object} requestData - Request data to check
   * @returns {Array} - List of potential issues
   */
  static checkCommonIssues(requestData) {
    const issues = [];
    
    // Check for undefined values
    const checkUndefined = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) {
          issues.push(`Undefined value at ${path}.${key}`);
        } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          checkUndefined(value, `${path}.${key}`);
        }
      }
    };
    
    checkUndefined(requestData);
    
    // Check for null values in arrays
    if (Array.isArray(requestData)) {
      requestData.forEach((item, index) => {
        if (item === null) {
          issues.push(`Null value in array at index ${index}`);
        }
      });
    }
    
    // Check for empty strings that should be omitted
    const checkEmptyStrings = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (value === '') {
          issues.push(`Empty string at ${path}.${key} - consider omitting`);
        } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          checkEmptyStrings(value, `${path}.${key}`);
        }
      }
    };
    
    checkEmptyStrings(requestData);
    
    return issues;
  }

  /**
   * Provides suggestions for fixing 400 errors
   * @param {Error} error - The error object
   * @param {Object} requestData - The request data
   * @returns {Array} - List of suggestions
   */
  static getSuggestions(error, requestData) {
    const suggestions = [];
    
    if (error.message.includes('malformed')) {
      suggestions.push('Check for special characters or invalid formatting in your data');
    }
    
    if (error.message.includes('size')) {
      suggestions.push('Reduce the size of your request data');
    }
    
    if (error.message.includes('invalid')) {
      suggestions.push('Validate all input data before sending');
    }
    
    // Check request data for common issues
    const issues = this.checkCommonIssues(requestData);
    if (issues.length > 0) {
      suggestions.push('Fix the following data issues:', ...issues);
    }
    
    // Check JSON validation
    const jsonValidation = this.validateJsonData(requestData);
    if (!jsonValidation.isValid) {
      suggestions.push('Fix JSON validation issues:', ...jsonValidation.issues);
    }
    
    return suggestions;
  }

  /**
   * Logs a comprehensive error report
   * @param {Error} error - The error object
   * @param {Object} context - Additional context
   */
  static logErrorReport(error, context = {}) {
    console.group('🚨 400 Error Report');
    console.error('Error:', error);
    console.error('Context:', context);
    
    const suggestions = this.getSuggestions(error, context.requestData || {});
    if (suggestions.length > 0) {
      console.group('💡 Suggestions');
      suggestions.forEach(suggestion => console.log('•', suggestion));
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

export default Debug400Errors;
