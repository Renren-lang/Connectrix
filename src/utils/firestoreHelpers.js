// Firestore helper functions to prevent 400 Bad Request errors

/**
 * Validates and sanitizes data before sending to Firestore
 * @param {Object} data - The data to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} - Sanitized data
 */
export function sanitizeFirestoreData(data, options = {}) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data: must be an object');
  }

  const sanitized = {};
  const maxStringLength = options.maxStringLength || 1000;
  const maxArrayLength = options.maxArrayLength || 100;

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      // Trim and limit string length
      sanitized[key] = value.trim().substring(0, maxStringLength);
    } else if (Array.isArray(value)) {
      // Limit array length and sanitize each item
      sanitized[key] = value
        .slice(0, maxArrayLength)
        .map(item => {
          if (typeof item === 'string') {
            return item.trim().substring(0, 200);
          }
          return item;
        });
    } else if (typeof value === 'object' && value.constructor === Object) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeFirestoreData(value, options);
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      // Keep primitive types as-is
      sanitized[key] = value;
    } else if (value instanceof Date) {
      // Keep Date objects as-is
      sanitized[key] = value;
    } else {
      // Convert other types to string and sanitize
      sanitized[key] = String(value).trim().substring(0, maxStringLength);
    }
  }

  return sanitized;
}

/**
 * Validates a Firestore document ID
 * @param {string} id - The document ID to validate
 * @returns {boolean} - Whether the ID is valid
 */
export function isValidDocumentId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Firestore document IDs must be non-empty strings
  // and cannot contain certain characters
  const invalidChars = /[\/\s]/;
  return id.length > 0 && id.length <= 1500 && !invalidChars.test(id);
}

/**
 * Validates a Firestore collection name
 * @param {string} collectionName - The collection name to validate
 * @returns {boolean} - Whether the collection name is valid
 */
export function isValidCollectionName(collectionName) {
  if (!collectionName || typeof collectionName !== 'string') {
    return false;
  }
  
  // Collection names must be non-empty strings
  // and cannot contain certain characters
  const invalidChars = /[\/\s]/;
  return collectionName.length > 0 && collectionName.length <= 1500 && !invalidChars.test(collectionName);
}

/**
 * Safely executes a Firestore operation with error handling
 * @param {Function} operation - The Firestore operation to execute
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise} - The result of the operation
 */
export async function safeFirestoreOperation(operation, operationName = 'Firestore operation') {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${operationName}:`, error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific Firestore errors
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your authentication status.');
    } else if (error.code === 'not-found') {
      throw new Error('Document not found.');
    } else if (error.code === 'already-exists') {
      throw new Error('Document already exists.');
    } else if (error.code === 'invalid-argument') {
      throw new Error('Invalid data provided. Please check your input.');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Operation failed due to a precondition.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please try again.');
    } else {
      throw new Error(`Operation failed: ${error.message}`);
    }
  }
}

/**
 * Validates user input for Firestore operations
 * @param {Object} input - The input to validate
 * @param {Object} schema - The validation schema
 * @returns {Object} - Validated and sanitized input
 */
export function validateUserInput(input, schema) {
  if (!input || typeof input !== 'object') {
    throw new Error('Input must be an object');
  }

  const validated = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = input[field];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new Error(`${field} is required`);
    }

    if (value !== undefined && value !== null && value !== '') {
      if (rules.type && typeof value !== rules.type) {
        throw new Error(`${field} must be of type ${rules.type}`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        throw new Error(`${field} must be no more than ${rules.maxLength} characters`);
      }

      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        throw new Error(`${field} must be at least ${rules.minLength} characters`);
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        throw new Error(`${field} format is invalid`);
      }

      validated[field] = value;
    }
  }

  return validated;
}

/**
 * Creates a retry mechanism for Firestore operations
 * @param {Function} operation - The operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise} - The result of the operation
 */
export async function retryFirestoreOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain error types
      if (error.code === 'permission-denied' || 
          error.code === 'not-found' || 
          error.code === 'invalid-argument') {
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
