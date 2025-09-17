import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebugPanel = () => {
  const { 
    currentUser, 
    userRole, 
    loading, 
    debugAuthState, 
    restoreAuthState,
    resetRegistrationFlag,
    resetGoogleAuthFlag 
  } = useAuth();
  const [showPanel, setShowPanel] = useState(false);
  const [restoreResult, setRestoreResult] = useState('');

  const handleRestoreAuth = () => {
    const result = restoreAuthState();
    setRestoreResult(result.message);
    setTimeout(() => setRestoreResult(''), 3000);
  };

  const handleDebugAuth = () => {
    debugAuthState();
  };

  const handleResetFlags = () => {
    resetRegistrationFlag();
    resetGoogleAuthFlag();
    setRestoreResult('Flags reset successfully');
    setTimeout(() => setRestoreResult(''), 3000);
  };

  // Only show in development or when there are auth issues
  if (process.env.NODE_ENV === 'production' && currentUser) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong>Auth Debug Panel</strong>
        <button 
          onClick={() => setShowPanel(!showPanel)}
          style={{ 
            background: 'none', 
            border: '1px solid white', 
            color: 'white', 
            padding: '2px 6px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {showPanel ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {showPanel && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <div>User: {currentUser ? `${currentUser.email} (${currentUser.uid})` : 'None'}</div>
            <div>Role: {userRole || 'None'}</div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button 
              onClick={handleDebugAuth}
              style={{ 
                background: '#007bff', 
                border: 'none', 
                color: 'white', 
                padding: '5px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Debug Auth State
            </button>
            
            <button 
              onClick={handleRestoreAuth}
              style={{ 
                background: '#28a745', 
                border: 'none', 
                color: 'white', 
                padding: '5px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Restore Auth
            </button>
            
            <button 
              onClick={handleResetFlags}
              style={{ 
                background: '#ffc107', 
                border: 'none', 
                color: 'black', 
                padding: '5px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Reset Flags
            </button>
          </div>
          
          {restoreResult && (
            <div style={{ 
              marginTop: '10px', 
              padding: '5px', 
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '3px'
            }}>
              {restoreResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthDebugPanel;
