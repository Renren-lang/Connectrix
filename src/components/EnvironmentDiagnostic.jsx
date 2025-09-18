import React, { useState, useEffect } from 'react';

const EnvironmentDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState({});

  useEffect(() => {
    const runDiagnostics = () => {
      const diag = {
        environment: process.env.NODE_ENV,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        firebaseAuth: !!window.firebase?.auth,
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        cookies: !!document.cookie,
        online: navigator.onLine,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : 'N/A',
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        localStorageSize: (() => {
          try {
            let total = 0;
            for (let key in localStorage) {
              if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
              }
            }
            return `${total} characters`;
          } catch (e) {
            return 'Error calculating';
          }
        })(),
        errors: []
      };

      // Check for common issues
      try {
        if (!window.firebase) {
          diag.errors.push('Firebase not loaded');
        }
        if (!window.localStorage) {
          diag.errors.push('LocalStorage not available');
        }
        if (!navigator.cookieEnabled) {
          diag.errors.push('Cookies disabled');
        }
        if (!navigator.onLine) {
          diag.errors.push('Offline');
        }
      } catch (error) {
        diag.errors.push(`Error during diagnostics: ${error.message}`);
      }

      setDiagnostics(diag);
    };

    runDiagnostics();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '15px',
        maxWidth: '300px',
        fontSize: '12px',
        zIndex: 9999,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🔧 Environment Diagnostic</h4>
        <div style={{ marginBottom: '10px' }}>
          <strong>Environment:</strong> {diagnostics.environment}<br/>
          <strong>URL:</strong> {diagnostics.url}<br/>
          <strong>Online:</strong> {diagnostics.online ? '✅' : '❌'}<br/>
          <strong>Cookies:</strong> {diagnostics.cookieEnabled ? '✅' : '❌'}<br/>
          <strong>LocalStorage:</strong> {diagnostics.localStorage ? '✅' : '❌'}<br/>
          <strong>Firebase:</strong> {diagnostics.firebaseAuth ? '✅' : '❌'}
        </div>
        {diagnostics.errors && diagnostics.errors.length > 0 && (
          <div style={{ color: '#dc3545', marginTop: '10px' }}>
            <strong>Issues:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
              {diagnostics.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '10px' }}>
          {diagnostics.timestamp}
        </div>
      </div>
    );
  }

  return null;
};

export default EnvironmentDiagnostic;
