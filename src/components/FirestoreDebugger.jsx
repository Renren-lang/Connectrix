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

  // Show in both development and production for debugging purposes
  // Always show the reset button for debugging

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'rgba(0, 123, 255, 0.9)',
      border: '1px solid #007bff',
      borderRadius: '8px',
      padding: '10px',
      boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
      backdropFilter: 'blur(10px)'
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
