// Firestore Connection Utility
// Handles connection issues and provides recovery mechanisms

import { db } from '../firebase';

let connectionResetTimeout = null;

// Reset Firestore connection
export const resetFirestoreConnection = async () => {
  try {
    console.log('🔄 Resetting Firestore connection...');
    
    // Clear any existing timeout
    if (connectionResetTimeout) {
      clearTimeout(connectionResetTimeout);
    }
    
    // Force a connection reset by clearing any cached connections
    if (db && db._delegate) {
      // This is a workaround for the "Unknown SID" issue
      try {
        // Force disconnect and reconnect
        await db._delegate._terminate();
        console.log('✅ Firestore connection reset successfully');
      } catch (error) {
        console.warn('⚠️ Could not reset Firestore connection:', error.message);
      }
    }
    
    // Wait a bit before allowing new connections
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('❌ Error resetting Firestore connection:', error);
  }
};

// Monitor for "Unknown SID" errors and auto-reset
export const monitorFirestoreErrors = () => {
  // Listen for unhandled promise rejections that might be Firestore related
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && 
        (event.reason.message?.includes('Unknown SID') || 
         event.reason.code === 'unavailable')) {
      console.warn('🔄 Detected Firestore connection error, scheduling reset...');
      
      // Schedule a connection reset
      if (connectionResetTimeout) {
        clearTimeout(connectionResetTimeout);
      }
      
      connectionResetTimeout = setTimeout(() => {
        resetFirestoreConnection();
      }, 2000); // Wait 2 seconds before resetting
    }
  });
};

// Initialize connection monitoring
export const initializeConnectionMonitoring = () => {
  console.log('🔍 Initializing Firestore connection monitoring...');
  monitorFirestoreErrors();
};

// Cleanup function
export const cleanupConnectionMonitoring = () => {
  if (connectionResetTimeout) {
    clearTimeout(connectionResetTimeout);
    connectionResetTimeout = null;
  }
};
