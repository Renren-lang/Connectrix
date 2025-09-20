import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebugger = () => {
  const { currentUser, userRole, loading, debugAuthState } = useAuth();

  const handleDebugAuth = () => {
    debugAuthState();
  };

  const handleClearAuth = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminUser');
    window.location.reload();
  };

  const handleTestFirebaseAuth = () => {
    console.group('🔥 Firebase Auth Test');
    console.log('Firebase Auth Instance:', window.firebase?.auth?.());
    console.log('Current User from Firebase:', window.firebase?.auth?.()?.currentUser);
    console.log('Auth State:', window.firebase?.auth?.()?.currentUser ? 'Authenticated' : 'Not Authenticated');
    console.groupEnd();
  };

  // Hide debugger completely in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#4ade80' }}>🔍 Auth Debugger</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Status:</strong> {loading ? 'Loading...' : currentUser ? 'Authenticated' : 'Not Authenticated'}
      </div>
      
      {currentUser && (
        <div style={{ marginBottom: '8px' }}>
          <strong>User:</strong> {currentUser.email || currentUser.uid}
        </div>
      )}
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Role:</strong> {userRole || 'None'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>LocalStorage Role:</strong> {localStorage.getItem('userRole') || 'None'}
      </div>
      
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button
          onClick={handleDebugAuth}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Debug Auth
        </button>
        
        <button
          onClick={handleClearAuth}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Clear Auth
        </button>
        
        <button
          onClick={handleTestFirebaseAuth}
          style={{
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Test Firebase
        </button>
      </div>
    </div>
  );
};

export default AuthDebugger;
