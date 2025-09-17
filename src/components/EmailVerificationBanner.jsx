import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationBanner = () => {
  const { currentUser, sendEmailVerificationToUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendVerification = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await sendEmailVerificationToUser();
      setMessage(result.message);
    } catch (error) {
      setMessage('Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show banner if email is verified or no user
  if (!currentUser || currentUser.emailVerified) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Email Verification Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Please verify your email address ({currentUser.email}) to access all features.
              Check your inbox for a verification email.
            </p>
          </div>
          <div className="mt-3">
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
            {message && (
              <p className={`mt-2 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
