// Authentication debugging utilities

/**
 * Debug authentication state and configuration
 */
export function debugAuthState(auth, currentUser) {
  console.group('🔍 Authentication Debug Information');
  
  // Firebase Auth instance info
  console.log('Firebase Auth Instance:', auth);
  console.log('Auth App:', auth?.app);
  console.log('Auth Config:', auth?.config);
  
  // Current user info
  console.log('Current User:', currentUser);
  if (currentUser) {
    console.log('User UID:', currentUser.uid);
    console.log('User Email:', currentUser.email);
    console.log('User Display Name:', currentUser.displayName);
    console.log('User Email Verified:', currentUser.emailVerified);
    console.log('User Creation Time:', currentUser.metadata?.creationTime);
    console.log('Last Sign In Time:', currentUser.metadata?.lastSignInTime);
  }
  
  // Local storage info
  console.log('Stored User Role:', localStorage.getItem('userRole'));
  console.log('Stored Admin User:', localStorage.getItem('adminUser'));
  
  // Firebase project info
  if (auth?.app) {
    console.log('Firebase Project ID:', auth.app.options?.projectId);
    console.log('Firebase API Key:', auth.app.options?.apiKey);
    console.log('Firebase Auth Domain:', auth.app.options?.authDomain);
  }
  
  console.groupEnd();
}

/**
 * Debug authentication error with detailed information
 */
export function debugAuthError(error, context = 'Authentication') {
  console.group(`🚨 ${context} Error Debug`);
  
  console.error('Error Object:', error);
  console.error('Error Code:', error.code);
  console.error('Error Message:', error.message);
  console.error('Error Stack:', error.stack);
  
  // Additional error properties
  if (error.customData) {
    console.error('Custom Data:', error.customData);
  }
  
  // Common error codes and their meanings
  const errorMeanings = {
    'auth/invalid-credential': 'The email or password is incorrect',
    'auth/user-not-found': 'No user account exists with this email',
    'auth/wrong-password': 'The password is incorrect',
    'auth/invalid-email': 'The email address is malformed',
    'auth/user-disabled': 'The user account has been disabled',
    'auth/too-many-requests': 'Too many failed attempts, try again later',
    'auth/network-request-failed': 'Network error occurred',
    'auth/operation-not-allowed': 'This sign-in method is not enabled',
    'auth/weak-password': 'The password is too weak',
    'auth/email-already-in-use': 'An account already exists with this email',
    'auth/credential-already-in-use': 'This credential is already associated with another account',
    'auth/popup-closed-by-user': 'The popup was closed by the user',
    'auth/popup-blocked': 'The popup was blocked by the browser',
    'auth/cancelled-popup-request': 'Another sign-in process is already in progress'
  };
  
  if (errorMeanings[error.code]) {
    console.error('Error Meaning:', errorMeanings[error.code]);
  }
  
  console.groupEnd();
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    message: emailRegex.test(email) ? 'Valid email' : 'Invalid email format'
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  const validations = {
    length: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(validations).filter(Boolean).length;
  
  return {
    isValid: validations.length,
    score: score,
    strength: score < 2 ? 'Weak' : score < 4 ? 'Medium' : 'Strong',
    validations: validations
  };
}

/**
 * Test Firebase connection
 */
export async function testFirebaseConnection(auth) {
  try {
    console.group('🔗 Testing Firebase Connection');
    
    // Test auth state
    console.log('Auth instance available:', !!auth);
    console.log('Auth app available:', !!auth?.app);
    
    // Test current user
    const currentUser = auth.currentUser;
    console.log('Current user available:', !!currentUser);
    
    if (currentUser) {
      console.log('User is authenticated:', true);
      console.log('User UID:', currentUser.uid);
    } else {
      console.log('User is not authenticated:', true);
    }
    
    // Test auth state listener
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('Auth state listener working:', true);
        console.log('User from listener:', user ? 'Authenticated' : 'Not authenticated');
        unsubscribe();
        resolve(true);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.warn('Auth state listener timeout');
        unsubscribe();
        resolve(false);
      }, 5000);
    });
    
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  } finally {
    console.groupEnd();
  }
}

/**
 * Debug login attempt
 */
export function debugLoginAttempt(email, password) {
  console.group('🔐 Login Attempt Debug');
  
  console.log('Email provided:', email);
  console.log('Password provided:', password ? 'Yes' : 'No');
  console.log('Password length:', password?.length || 0);
  
  // Validate email
  const emailValidation = validateEmail(email);
  console.log('Email validation:', emailValidation);
  
  // Validate password
  const passwordValidation = validatePassword(password);
  console.log('Password validation:', passwordValidation);
  
  console.groupEnd();
  
  return {
    emailValid: emailValidation.isValid,
    passwordValid: passwordValidation.isValid,
    emailMessage: emailValidation.message,
    passwordStrength: passwordValidation.strength
  };
}
