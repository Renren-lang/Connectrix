import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './MentorshipRequestModal.css';

function MentorshipRequestModal({ isOpen, onClose, notification, onRequestHandled }) {
  const { currentUser } = useAuth();
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch student details when modal opens
  useEffect(() => {
    if (isOpen && notification?.studentId) {
      fetchStudentDetails();
    }
  }, [isOpen, notification]);

  const fetchStudentDetails = async () => {
    try {
      setIsLoading(true);
      const studentDoc = await getDoc(doc(db, 'users', notification.studentId));
      if (studentDoc.exists()) {
        setStudent({ id: studentDoc.id, ...studentDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      
      // Update the mentorship request status
      const requestRef = doc(db, 'mentorshipRequests', notification.requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        respondedAt: serverTimestamp(),
        respondedBy: currentUser.uid
      });

      // Create a notification for the student
      await addDoc(collection(db, 'notifications'), {
        recipientId: notification.studentId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}`,
        senderPhotoURL: currentUser.photoURL,
        type: 'mentorship_accepted',
        title: 'Mentorship Request Accepted!',
        message: `${currentUser.displayName || 'Your mentor'} has accepted your mentorship request. You can now start communicating!`,
        read: false,
        createdAt: serverTimestamp()
      });

      // Mark the original notification as read
      if (notification.id) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          status: 'accepted'
        });
      }

      onRequestHandled('accepted');
      onClose();
    } catch (error) {
      console.error('Error accepting mentorship request:', error);
      alert('Error accepting request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsProcessing(true);
      
      // Update the mentorship request status
      const requestRef = doc(db, 'mentorshipRequests', notification.requestId);
      await updateDoc(requestRef, {
        status: 'declined',
        respondedAt: serverTimestamp(),
        respondedBy: currentUser.uid
      });

      // Create a notification for the student
      await addDoc(collection(db, 'notifications'), {
        recipientId: notification.studentId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}`,
        senderPhotoURL: currentUser.photoURL,
        type: 'mentorship_declined',
        title: 'Mentorship Request Declined',
        message: `${currentUser.displayName || 'Your mentor'} has declined your mentorship request. You can try reaching out to other mentors.`,
        read: false,
        createdAt: serverTimestamp()
      });

      // Mark the original notification as read
      if (notification.id) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
          status: 'declined'
        });
      }

      onRequestHandled('declined');
      onClose();
    } catch (error) {
      console.error('Error declining mentorship request:', error);
      alert('Error declining request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !notification) return null;

  return (
    <div className="mentorship-request-modal-overlay" onClick={onClose}>
      <div className="mentorship-request-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Mentorship Request</h3>
          <button className="close-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="modal-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading student details...</p>
            </div>
          ) : student ? (
            <div className="request-details">
              <div className="student-info">
                <div className="student-avatar">
                  {student.photoURL ? (
                    <img src={student.photoURL} alt={student.displayName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {student.displayName?.charAt(0) || student.firstName?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
                <div className="student-details">
                  <h4>{student.displayName || `${student.firstName} ${student.lastName}`}</h4>
                  <p className="student-email">{student.email}</p>
                  {student.course && (
                    <p className="student-course">{student.course}</p>
                  )}
                  {student.batch && (
                    <p className="student-batch">Batch: {student.batch}</p>
                  )}
                </div>
              </div>

              <div className="request-message">
                <h5>Request Message:</h5>
                <p>{notification.message || 'No message provided'}</p>
              </div>

              {student.bio && (
                <div className="student-bio">
                  <h5>About the Student:</h5>
                  <p>{student.bio}</p>
                </div>
              )}

              <div className="request-actions">
                <button 
                  className="decline-btn"
                  onClick={handleDecline}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Decline'}
                </button>
                <button 
                  className="accept-btn"
                  onClick={handleAccept}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Accept Request'}
                </button>
              </div>
            </div>
          ) : (
            <div className="error-state">
              <p>Unable to load student details. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MentorshipRequestModal;

