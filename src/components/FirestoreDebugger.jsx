import React, { useState } from 'react';
import { resetFirestoreConnection } from '../utils/firestoreConnection';

const FirestoreDebugger = () => {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetConnection = async () => {
    setIsResetting(true);
    try {
      await resetFirestoreConnection();
      console.log('✅ Firestore connection reset completed');
    } catch (error) {
      console.error('❌ Error resetting connection:', error);
    } finally {
      setIsResetting(false);
    }
  };

  // Only show in development or when there are connection issues
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <button
        onClick={handleResetConnection}
        disabled={isResetting}
        style={{
          background: isResetting ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: isResetting ? 'not-allowed' : 'pointer',
          fontSize: '12px'
        }}
      >
        {isResetting ? 'Resetting...' : 'Reset Firestore'}
      </button>
    </div>
  );
};

export default FirestoreDebugger;
