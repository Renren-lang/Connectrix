import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function MentorStatusToggle() {
  const { currentUser, updateUserProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Only show this component for alumni users
  if (!currentUser || currentUser.role !== 'alumni') {
    return null;
  }

  const handleToggleMentoring = async () => {
    if (!currentUser) return;
    
    setIsUpdating(true);
    try {
      const newStatus = !currentUser.willingToMentor;
      
      // Update in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        willingToMentor: newStatus
      });
      
      // Update local state
      await updateUserProfile(currentUser.uid, {
        willingToMentor: newStatus
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error updating mentoring status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mentor-status-toggle">
      <div className="status-info">
        <h4>Mentoring Status</h4>
        <p>
          Current status: 
          <span className={`status-badge ${currentUser.willingToMentor ? 'available' : 'unavailable'}`}>
            {currentUser.willingToMentor ? 'Available for Mentoring' : 'Not Available'}
          </span>
        </p>
      </div>
      
      <button
        className={`toggle-btn ${currentUser.willingToMentor ? 'unavailable' : 'available'}`}
        onClick={handleToggleMentoring}
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 
          currentUser.willingToMentor ? 'Set as Unavailable' : 'Set as Available'
        }
      </button>
      
      {showSuccess && (
        <div className="success-message">
          Mentoring status updated successfully!
        </div>
      )}
      
      <style jsx>{`
        .mentor-status-toggle {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .status-info h4 {
          margin: 0 0 0.5rem 0;
          color: #495057;
        }
        
        .status-info p {
          margin: 0;
          color: #6c757d;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-left: 0.5rem;
        }
        
        .status-badge.available {
          background: #d4edda;
          color: #155724;
        }
        
        .status-badge.unavailable {
          background: #f8d7da;
          color: #721c24;
        }
        
        .toggle-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .toggle-btn.available {
          background: #28a745;
          color: white;
        }
        
        .toggle-btn.unavailable {
          background: #dc3545;
          color: white;
        }
        
        .toggle-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .success-message {
          margin-top: 1rem;
          padding: 0.5rem;
          background: #d4edda;
          color: #155724;
          border-radius: 4px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default MentorStatusToggle;
