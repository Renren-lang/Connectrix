import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

function MentorshipMatching() {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const [activeRole, setActiveRole] = useState('alumni');
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);



  // Fetch mentorship requests from Firestore
  const fetchMentorshipRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const requestsRef = collection(db, 'mentorship-requests');
      const q = query(
        requestsRef,
        where('mentorId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const requestsData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        
        // Fetch student details from users collection
        const studentRef = doc(db, 'users', data.studentId);
        const studentSnap = await getDoc(studentRef);
        
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          const firstName = studentData.firstName || '';
          const lastName = studentData.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          // Better fallback logic for display name
          let displayName = fullName;
          if (!displayName && studentData.displayName) {
            displayName = studentData.displayName;
          }
          if (!displayName && studentData.email) {
            displayName = studentData.email.split('@')[0];
          }
          if (!displayName) {
            displayName = 'Student';
          }
          
          return {
            id: docSnapshot.id,
            name: displayName,
            avatar: displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            details: `${studentData.course || 'Student'} '${studentData.batch || ''} • ${data.interests || 'Interested in mentorship'}`,
            message: data.message || 'I would like to request your mentorship.',
            status: data.status,
            studentId: data.studentId,
            studentEmail: studentData.email,
            course: studentData.course,
            batch: studentData.batch,
            careerGoals: studentData.careerGoals
          };
        }
        return null;
      }));
      
      // Remove any null entries and duplicates
      const validRequests = requestsData.filter(Boolean);
      const uniqueRequests = validRequests.filter((request, index, self) => 
        index === self.findIndex(r => r.studentId === request.studentId)
      );
      
      setMentorshipRequests(uniqueRequests);
      console.log('Fetched mentorship requests:', uniqueRequests.length);
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Fetch mentorship requests on component mount
  useEffect(() => {
    if (currentUser && userRole === 'alumni') {
      fetchMentorshipRequests();
    }
  }, [currentUser, userRole]);

  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: ''
  });



  const handleViewProfile = (name) => {
    alert(`Viewing profile of ${name}`);
  };

  const handleMentorshipResponse = async (requestId, action) => {
    try {
      const request = mentorshipRequests.find(r => r.id === requestId);
      if (!request) {
        console.error('Request not found');
        return;
      }

      // Update the request in Firestore
      const requestRef = doc(db, 'mentorship-requests', requestId);
      await updateDoc(requestRef, {
        status: action,
        updatedAt: serverTimestamp()
      });

      // Create notification for the student
      const notification = {
        recipientId: request.studentId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Alumni',
        type: 'mentorship-response',
        title: action === 'accepted' ? 'Mentorship Request Accepted!' : 'Mentorship Request Declined',
        message: action === 'accepted' 
          ? `${currentUser.displayName || 'An alumni'} has accepted your mentorship request. You can now start messaging them!`
          : `${currentUser.displayName || 'An alumni'} has declined your mentorship request.`,
        data: {
          requestId: requestId,
          mentorId: currentUser.uid,
          mentorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Alumni',
          action: action
        },
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add notification to Firestore
      await addDoc(collection(db, 'notifications'), notification);
      console.log('Notification created for student:', request.studentId);

      // Update local state
      setMentorshipRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, status: action }
            : request
        )
      );

      const actionText = action === 'accepted' ? 'accepted' : 'declined';
      showNotificationToast('Request Updated', `You have ${actionText} the mentorship request from ${request.name}. The student has been notified.`);
    } catch (error) {
      console.error('Error updating mentorship request:', error);
      showNotificationToast('Error', 'Failed to update mentorship request. Please try again.');
    }
  };

  const showNotificationToast = (title, message) => {
    setNotificationData({ title, message });
    setShowNotification(true);

    // Auto hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const closeNotification = () => {
    setShowNotification(false);
  };





  const pendingRequestsCount = mentorshipRequests.filter(request => request.status === 'pending').length;

  return (
    <>
      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Mentorship Requests</h1>
            <p className="page-subtitle">Manage your mentorship requests from students</p>
            

          </div>





          {/* Mentorship Requests */}
          <div className="mentorship-requests active">
              <div className="requests-container">
                <div className="requests-header">
                  <h2 className="requests-title">Pending Mentorship Requests</h2>
                  <span className="request-count">{pendingRequestsCount}</span>
                </div>
                <div className="requests-list">
                  {isLoadingRequests ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Loading mentorship requests...</p>
                    </div>
                  ) : mentorshipRequests.length > 0 ? (
                    mentorshipRequests.map(request => (
                    <div key={request.id} className="request-item">
                      <div className="request-avatar">{request.avatar}</div>
                      <div className="request-info">
                        <div className="request-name">{request.name}</div>
                        <div className="request-details">{request.details}</div>
                        <div className="request-message">"{request.message}"</div>
                      </div>
                      <div className="request-actions">
                        {request.status === 'pending' && (
                          <>
                            <button
                              className="btn-accept"
                              onClick={() => handleMentorshipResponse(request.id, 'accepted')}
                            >
                              Accept
                            </button>
                            <button
                              className="btn-decline"
                              onClick={() => handleMentorshipResponse(request.id, 'declined')}
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {request.status === 'accepted' && (
                          <button className="btn-accept" disabled style={{ backgroundColor: 'var(--success-color)' }}>
                            Accepted
                          </button>
                        )}
                        {request.status === 'declined' && (
                          <button className="btn-decline" disabled style={{ backgroundColor: 'var(--danger-color)' }}>
                            Declined
                          </button>
                        )}
                        <button
                          className="btn-view-profile"
                          onClick={() => handleViewProfile(request.name)}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <i className="fas fa-inbox"></i>
                      </div>
                      <h3 className="empty-title">No mentorship requests</h3>
                      <p className="empty-message">You don't have any pending mentorship requests at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      </main>

      {/* Notification Toast */}
      {showNotification && (
        <div className="notification-toast show">
          <div className="notification-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="notification-content">
            <div className="notification-title">{notificationData.title}</div>
            <div className="notification-message">{notificationData.message}</div>
          </div>
          <div className="notification-close" onClick={closeNotification}>
            <i className="fas fa-times"></i>
          </div>
        </div>
      )}
    </>
  );
}

export default MentorshipMatching;
