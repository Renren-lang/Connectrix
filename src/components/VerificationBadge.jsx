import React from 'react';
import './VerificationBadge.css';

const VerificationBadge = ({ status, type = 'student', size = 'medium' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          text: 'Verified',
          className: 'verified',
          icon: '✓'
        };
      case 'pending':
        return {
          text: 'Pending',
          className: 'pending',
          icon: '⏳'
        };
      case 'rejected':
        return {
          text: 'Rejected',
          className: 'rejected',
          icon: '✗'
        };
      default:
        return {
          text: 'Unverified',
          className: 'unverified',
          icon: '?'
        };
    }
  };

  const config = getStatusConfig();
  const typeClass = type === 'alumni' ? 'alumni' : 'student';

  return (
    <div className={`verification-badge ${config.className} ${typeClass} ${size}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-text">{config.text}</span>
    </div>
  );
};

export default VerificationBadge;
