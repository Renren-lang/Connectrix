import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import MentorshipRequestModal from './MentorshipRequestModal';
import './NotificationPopup.css';

function NotificationPopup({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);

  // Get notification settings from localStorage
  const getNotificationSettings = () => {
    try {
      const savedSettings = localStorage.getItem('notificationSettings');
      return savedSettings ? JSON.parse(savedSettings) : {
        pushNotifications: true,
        mentorshipRequests: true,
        messages: true,
        likesAndComments: true
      };
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return {
        pushNotifications: true,
        mentorshipRequests: true,
        messages: true,
        likesAndComments: true
      };
    }
  };

  // Fetch real-time notifications
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    setIsLoading(true);
    const notificationsRef = collection(db, 'notifications');
    
    // Try the main query first (with orderBy - needs Firebase index)
    let q;
    try {
      q = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    } catch (queryError) {
      console.warn('Query construction failed:', queryError);
      // Fallback: query without orderBy, then sort in JavaScript
      q = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter notifications based on user settings
      const notificationSettings = getNotificationSettings();
      const filteredNotifications = notificationsData.filter(notification => {
        // If push notifications are disabled, hide all notifications
        if (!notificationSettings.pushNotifications) {
          return false;
        }
        
        // Filter by notification type based on settings
        const notificationType = notification.type || 'general';
        
        switch (notificationType) {
          case 'mentorship_request':
            return notificationSettings.mentorshipRequests;
          case 'message':
            return false; // Don't show message notifications in popup - handled by message button
          case 'like':
          case 'comment':
            return notificationSettings.likesAndComments;
          default:
            return true; // Show general notifications
        }
      });
      
      // If we used fallback query (no orderBy), sort in JavaScript
      if (filteredNotifications.length > 0) {
        try {
          filteredNotifications.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return bTime - aTime; // Descending order (newest first)
          });
        } catch (sortError) {
          console.warn('JavaScript sorting failed:', sortError);
        }
      }
      
      setNotifications(filteredNotifications);
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to notifications:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, isOpen]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Navigate to notifications page
  const handleViewAllNotifications = () => {
    onClose(); // Close the popup first
    navigate('/notifications');
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Always mark as read first
    markAsRead(notification.id);
    
    if (notification.type === 'mentorship_request' && currentUser?.userRole === 'alumni') {
      // Show mentorship request modal for alumni
      setSelectedRequest(notification);
      setShowMentorshipModal(true);
    } else if (notification.type === 'message') {
      // Navigate to specific conversation for message notifications
      onClose();
      if (notification.senderId) {
        // Navigate to messaging with specific conversation
        navigate('/messaging', { 
          state: { 
            startChatWith: { 
              id: notification.senderId, 
              name: notification.senderName || 'User',
              role: notification.senderRole || 'user'
            } 
          } 
        });
      } else {
        // Fallback to general messaging page
        navigate('/messaging');
      }
    } else if (notification.type === 'mentorship_accepted') {
      // Navigate to mentor profile when mentorship is accepted
      onClose();
      if (notification.senderId) {
        navigate(`/profile/${notification.senderId}`);
      } else {
        navigate('/profile');
      }
    } else if (notification.type === 'mentorship_declined') {
      // Navigate to browse mentors when mentorship is declined
      onClose();
      navigate('/browse-mentor');
    } else if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'reaction' || 
               notification.type === 'forum-comment' || notification.type === 'forum-reaction' ||
               notification.type === 'post_like' || notification.type === 'post_comment' || 
               notification.type === 'post_reaction' || notification.type === 'general') {
      // Navigate to forum/post when someone likes, comments, or reacts
      onClose();
      const postId = notification.postId || notification.data?.postId;
      if (postId) {
        // If we have a specific post ID, navigate to that post using URL fragment
        navigate(`/forum#post-${postId}`);
      } else {
        // Otherwise, go to forum
        navigate('/forum');
      }
    } else if (notification.type === 'forum_post' || notification.type === 'forum_reply' ||
               notification.type === 'new_post' || notification.type === 'post_created') {
      // Navigate to forum for forum-related notifications
      onClose();
      const postId = notification.postId || notification.data?.postId;
      if (postId) {
        // If we have a specific post ID, navigate to that post
        navigate(`/forum#post-${postId}`);
      } else {
        // Otherwise, go to forum
        navigate('/forum');
      }
    } else if (notification.type === 'event' || notification.type === 'new_event' || 
               notification.type === 'event_reminder') {
      // Navigate to events page for event notifications
      onClose();
      navigate('/events');
    } else if (notification.type === 'profile_visit' || notification.type === 'profile_view') {
      // Navigate to profile for profile-related notifications
      onClose();
      if (notification.senderId) {
        navigate(`/profile/${notification.senderId}`);
      } else {
        navigate('/profile');
      }
    } else if (notification.type === 'connection' || notification.type === 'friend_request' ||
               notification.type === 'connection_request') {
      // Navigate to connections or profile for connection notifications
      onClose();
      if (notification.senderId) {
        navigate(`/profile/${notification.senderId}`);
      } else {
        navigate('/profile');
      }
    } else {
      // For other notifications, just close popup
      onClose();
    }
  };

  // Handle mentorship request response
  const handleMentorshipRequestHandled = (status) => {
    // Remove the notification from the list or update its status
    setNotifications(prev => 
      prev.filter(notification => notification.id !== selectedRequest?.id)
    );
    setShowMentorshipModal(false);
    setSelectedRequest(null);
  };

  // Format notification time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mentorship_request':
        return 'fas fa-user-plus';
      case 'message':
        return 'fas fa-comment';
      case 'like':
        return 'fas fa-heart';
      case 'comment':
        return 'fas fa-comment-dots';
      default:
        return 'fas fa-bell';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-popup-overlay" onClick={onClose}>
      <div className="notification-popup" onClick={(e) => e.stopPropagation()}>
        <div className="notification-popup-header">
          <h3>Notifications</h3>
          <div className="notification-actions">
            <button 
              className="view-all-btn"
              onClick={handleViewAllNotifications}
            >
              View All
            </button>
            {notifications.some(n => !n.read) && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>
        
        <div className="notification-popup-content">
          {isLoading ? (
            <div className="loading-notifications">
              <div className="loading-spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <span className="material-icons">notifications_none</span>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    <i className={getNotificationIcon(notification.type)}></i>
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  <div className="notification-arrow">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                  {!notification.read && <div className="unread-indicator"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Mentorship Request Modal */}
      <MentorshipRequestModal
        isOpen={showMentorshipModal}
        onClose={() => {
          setShowMentorshipModal(false);
          setSelectedRequest(null);
        }}
        notification={selectedRequest}
        onRequestHandled={handleMentorshipRequestHandled}
      />
    </div>
  );
}

export default NotificationPopup;
