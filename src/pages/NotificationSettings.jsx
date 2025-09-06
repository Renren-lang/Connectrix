import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { createTestNotification, createMultipleTestNotifications } from '../utils/testNotifications';
import './NotificationSettings.css';

function NotificationSettings() {
  const { currentUser, logout, updateUserProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State for active section
  const [activeSection, setActiveSection] = useState('notifications');
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    mentorshipRequests: true,
    messages: true,
    likesAndComments: true,
    pushNotifications: true,
    snoozeUntil: null
  });
  
  // Profile editing state - initialize with current user data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    batch: '',
    course: '',
    bio: ''
  });
  
  // Password change state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  
  // Success messages state
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);
  const [showSecuritySuccess, setShowSecuritySuccess] = useState(false);
  
  // Form submission state
  const [isSubmitting, setSubmitting] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  
  const [snoozeOptions] = useState([
    { value: 1, label: '1 hour' },
    { value: 4, label: '4 hours' },
    { value: 8, label: '8 hours' },
    { value: 24, label: '1 day' }
  ]);

  // Load current user profile data when component mounts
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        batch: currentUser.batch || '',
        course: currentUser.course || '',
        bio: currentUser.bio || ''
      });
    }
  }, [currentUser]);

  useEffect(() => {
    // Load saved notification settings from localStorage or database
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Fetch real-time notifications
  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, 'notifications');
    
    // Try the main query first (with orderBy - needs Firebase index)
    // To fix "The query requires an index" error: The index has been created in firestore.indexes.json
    // Collection: 'notifications', Fields: 'recipientId' (ASC) + 'createdAt' (DESC)
    let q;
    try {
      q = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      console.log('Executing notification query with orderBy...');
    } catch (queryError) {
      console.warn('Query construction failed:', queryError);
      // Fallback: query without orderBy, then sort in JavaScript
      q = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid)
      );
      console.log('Using fallback query without orderBy...');
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If we used fallback query (no orderBy), sort in JavaScript
      if (notificationsData.length > 0) {
        try {
          notificationsData.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return bTime - aTime; // Descending order (newest first)
          });
          console.log('Sorted notifications in JavaScript by createdAt');
        } catch (sortError) {
          console.warn('JavaScript sorting failed:', sortError);
          // Continue with unsorted data
        }
      }
      
      console.log('Fetched notifications:', notificationsData);
      setNotifications(notificationsData);
      setIsLoadingNotifications(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      
      // Provide helpful error messages
      if (error.message.includes('requires an index')) {
        console.log('💡 Index is being built. This error will resolve automatically once indexing completes.');
        console.log('💡 You can check index status at: https://console.firebase.google.com/project/cconnect-7f562/firestore/indexes');
      }
      
      setIsLoadingNotifications(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Profile form handlers
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letter');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letter');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Number');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Special character');
    
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#28a745'];
    
    return {
      score,
      label: strengthLabels[score] || 'Very Weak',
      color: strengthColors[score] || '#dc3545',
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : 'Strong password!'
    };
  };

  const handleSecurityInputChange = (e) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Check password strength for new password
    if (name === 'newPassword') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };


  // Profile picture handlers
  const handlePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePictureUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    setProfilePicture(null);
    setProfilePictureUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let updatedProfileData = { ...profileData };
      
      // Handle profile picture if one was selected
      if (profilePicture) {
        try {
          // Convert image to base64 for storage in Firestore
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64String = e.target.result;
            
            // Add the base64 string to the profile data
            updatedProfileData.profilePictureBase64 = base64String;
            
            // Also create a data URL for immediate display
            updatedProfileData.profilePictureUrl = base64String;
            
            console.log('Profile picture converted to base64 successfully');
            
            // Update profile in Firestore
            await updateUserProfile(currentUser.uid, updatedProfileData);
            
            // Refresh user profile data to get the latest information
            if (fetchUserProfile) {
              await fetchUserProfile(currentUser.uid);
            }
            
            // Clear the profile picture state after successful upload
            setProfilePicture(null);
            setProfilePictureUrl(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            
            setShowProfileSuccess(true);
            setTimeout(() => setShowProfileSuccess(false), 5000);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          };
          
          reader.readAsDataURL(profilePicture);
          return; // Exit early, the rest will be handled in the reader.onload
        } catch (conversionError) {
          console.error('Error converting profile picture:', conversionError);
          alert('Profile picture conversion failed, but other changes will be saved.');
        }
      }
      
      // Update profile in Firestore (for cases without photo upload)
      await updateUserProfile(currentUser.uid, updatedProfileData);
      
      // Refresh user profile data to get the latest information
      if (fetchUserProfile) {
        await fetchUserProfile(currentUser.uid);
      }
      
      setShowProfileSuccess(true);
      setTimeout(() => setShowProfileSuccess(false), 5000);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Security form submission
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    console.log('Password change form submitted');
    console.log('Security data:', securityData);
    console.log('Password strength:', passwordStrength);
    
    // Validate passwords match
    if (securityData.newPassword !== securityData.confirmPassword) {
      console.log('Passwords do not match');
      alert('New passwords do not match. Please try again.');
      return;
    }
    
    // Validate password length
    if (securityData.newPassword.length < 8) {
      console.log('Password too short');
      alert('Password must be at least 8 characters long. Please try again.');
      return;
    }
    
    // Validate password strength
    if (passwordStrength.score < 3) {
      console.log('Password too weak');
      alert('Password is too weak. Please include uppercase, lowercase, number, and special character.');
      return;
    }
    
    // Validate current password is provided
    if (!securityData.currentPassword) {
      console.log('Current password not provided');
      alert('Please enter your current password.');
      return;
    }
    
    console.log('Starting password change process...');
    setSubmitting(true);
    
    try {
      console.log('Re-authenticating user...');
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        securityData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      console.log('User re-authenticated successfully');
      
      console.log('Updating password...');
      // Update password
      await updatePassword(currentUser, securityData.newPassword);
      console.log('Password updated successfully');
      
      console.log('Setting success state...');
      setShowSecuritySuccess(true);
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => {
        console.log('Hiding success message');
        setShowSecuritySuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Password change failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific error cases
      if (error.code === 'auth/wrong-password') {
        alert('Current password is incorrect. Please try again.');
      } else if (error.code === 'auth/weak-password') {
        alert('New password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/requires-recent-login') {
        alert('For security reasons, please log out and log back in before changing your password.');
      } else {
        alert(`Password change failed: ${error.message}`);
      }
    } finally {
      console.log('Password change process completed');
      setSubmitting(false);
    }
  };

  // Reset forms
  const resetProfileForm = () => {
    if (currentUser) {
      setProfileData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        batch: currentUser.batch || '',
        course: currentUser.course || '',
        bio: currentUser.bio || ''
      });
    }
  };

  const resetSecurityForm = () => {
    setSecurityData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to landing page after successful logout
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleToggle = (setting) => {
    const newSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    };
    setNotificationSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const handleSnooze = (hours) => {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);
    
    const newSettings = {
      ...notificationSettings,
      snoozeUntil: snoozeUntil.toISOString()
    };
    setNotificationSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const clearSnooze = () => {
    const newSettings = {
      ...notificationSettings,
      snoozeUntil: null
    };
    setNotificationSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const isSnoozed = notificationSettings.snoozeUntil && new Date(notificationSettings.snoozeUntil) > new Date();

  const getSnoozeStatus = () => {
    if (!notificationSettings.snoozeUntil) return null;
    
    const snoozeTime = new Date(notificationSettings.snoozeUntil);
    const now = new Date();
    const diffMs = snoozeTime - now;
    
    if (diffMs <= 0) return null;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    }
    return `${diffMinutes}m remaining`;
  };

  // Get user initials for profile picture
  const getUserInitials = () => {
    if (currentUser) {
      const firstName = currentUser.firstName || '';
      const lastName = currentUser.lastName || '';
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
    }
    return 'U';
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: new Date()
      });
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, {
          read: true,
          readAt: new Date()
        });
      });
      
      await Promise.all(updatePromises);
      console.log(`Marked ${unreadNotifications.length} notifications as read`);
      alert(`Marked ${unreadNotifications.length} notifications as read!`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      alert('Error marking notifications as read. Please try again.');
    }
  };

  // Clear all notifications (for debugging)
  const clearAllNotifications = async () => {
    if (!currentUser) return;
    
    const confirmed = window.confirm('Are you sure you want to delete ALL notifications? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      // Get all notifications for current user
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      console.log(`Deleted ${snapshot.docs.length} notifications`);
      alert(`Deleted ${snapshot.docs.length} notifications!`);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      alert('Error clearing notifications. Please try again.');
    }
  };

  // Test functions for creating notifications
  const handleCreateTestNotification = async () => {
    if (!currentUser) return;
    
    try {
      await createTestNotification(currentUser.uid, 'mentorship_request');
      alert('Test notification created! Check the bell icon in the header.');
    } catch (error) {
      alert('Failed to create test notification: ' + error.message);
    }
  };

  const handleCreateMultipleTestNotifications = async () => {
    if (!currentUser) return;
    
    try {
      const results = await createMultipleTestNotifications(currentUser.uid);
      const successCount = results.filter(r => r.success).length;
      alert(`Created ${successCount} test notifications! Check the bell icon in the header.`);
    } catch (error) {
      alert('Failed to create test notifications: ' + error.message);
    }
  };

  // Get notification icon
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

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-settings">
      <div className="dashboard-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your notification preferences, profile, and security for Connectrix</p>
        </div>

        <div className="main-content">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Settings</h2>
            </div>
            <div className="sidebar-menu">
              <div 
                className={`menu-item ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveSection('notifications')}
              >
                <i className="fas fa-bell"></i>
                <span>Notifications</span>
              </div>
              <div 
                className={`menu-item ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSection('profile')}
              >
                <i className="fas fa-user"></i>
                <span>Edit Profile</span>
              </div>
              <div 
                className={`menu-item ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                <i className="fas fa-shield-alt"></i>
                <span>Change Password</span>
              </div>
              
              {/* Logout Button */}
              <div className="menu-item logout-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="settings-content">
            {/* Notifications Section */}
            <div className={`settings-section ${activeSection === 'notifications' ? 'active' : ''}`}>
              <div className="section-header">
                <h1 className="section-title">Notification Settings</h1>
                <p className="section-subtitle">Manage your notification preferences</p>
              </div>

              {/* Push Notifications Toggle */}
              <div className="setting-section">
                <div className="setting-header">
                  <h3>Push Notifications</h3>
                  <p>Enable or disable all push notifications</p>
                </div>
                <div className="setting-control">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={() => handleToggle('pushNotifications')}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="setting-status">
                    {notificationSettings.pushNotifications ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Notification Types */}
              <div className="setting-section">
                <h3>Notification Types</h3>
                
                {/* Mentorship Requests */}
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>✅ Mentorship Requests</h4>
                    <p>Get notified when students request mentorship</p>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.mentorshipRequests && notificationSettings.pushNotifications}
                        onChange={() => handleToggle('mentorshipRequests')}
                        disabled={!notificationSettings.pushNotifications}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                {/* Messages */}
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>✅ Messages</h4>
                    <p>Get notified for new chats and messages</p>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.messages && notificationSettings.pushNotifications}
                        onChange={() => handleToggle('messages')}
                        disabled={!notificationSettings.pushNotifications}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                {/* Likes & Comments */}
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>✅ Likes & Comments</h4>
                    <p>Get notified when someone likes or comments on your posts</p>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={notificationSettings.likesAndComments && notificationSettings.pushNotifications}
                        onChange={() => handleToggle('likesAndComments')}
                        disabled={!notificationSettings.pushNotifications}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Snooze Notifications */}
              <div className="setting-section">
                <h3>Snooze Notifications</h3>
                <p>Temporarily pause notifications for a set period</p>
                
                <div className="snooze-options">
                  {snoozeOptions.map(option => (
                    <button
                      key={option.value}
                      className="btn btn-outline snooze-btn"
                      onClick={() => handleSnooze(option.value)}
                      disabled={isSnoozed}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                
                {isSnoozed && (
                  <div className="snooze-status">
                    <p>Notifications snoozed until: {getSnoozeStatus()}</p>
                    <button 
                      className="btn btn-primary clear-snooze-btn"
                      onClick={clearSnooze}
                    >
                      Clear Snooze
                    </button>
                  </div>
                )}
              </div>

                                            {/* Test Notifications Section (for development/testing) */}
                <div className="setting-section">
                  <h3>Test Notifications</h3>
                  <p>Create test notifications to see the bell icon counter in action</p>
                  <div className="test-buttons">
                    <button 
                      className="btn btn-outline"
                      onClick={handleCreateTestNotification}
                    >
                      <i className="fas fa-plus"></i> Create 1 Test Notification
                    </button>
                    <button 
                      className="btn btn-outline"
                      onClick={handleCreateMultipleTestNotifications}
                    >
                      <i className="fas fa-plus"></i> Create 4 Test Notifications
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={clearAllNotifications}
                      style={{ marginLeft: '10px' }}
                    >
                      <i className="fas fa-trash"></i> Clear All Notifications
                    </button>
                  </div>
                </div>

               {/* Recent Notifications */}
                <div className="setting-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>Recent Notifications</h3>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={markAllAsRead}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        Mark All as Read
                      </button>
                    )}
                  </div>
                 <div className="notifications-list">
                   {isLoadingNotifications ? (
                     <div className="loading-state">
                       <i className="fas fa-spinner fa-spin"></i>
                       <p>Loading notifications...</p>
                     </div>
                   ) : notifications.filter(n => !n.read).length === 0 ? (
                     <div className="empty-state">
                       <i className="fas fa-bell-slash"></i>
                       <p>No unread notifications</p>
                       <small>All notifications have been read. New ones will appear here when they arrive.</small>
                     </div>
                   ) : (
                     notifications
                       .filter(notification => !notification.read) // Only show unread notifications
                       .slice(0, 10)
                       .map(notification => (
                         <div 
                           key={notification.id} 
                           className="notification-item unread"
                           onClick={() => markAsRead(notification.id)}
                         >
                           <div className="notification-icon">
                             <i className={getNotificationIcon(notification.type)}></i>
                           </div>
                           <div className="notification-content">
                             <div className="notification-title">{notification.title}</div>
                             <div className="notification-message">{notification.message}</div>
                             <div className="notification-time">
                               {formatNotificationTime(notification.createdAt)}
                             </div>
                           </div>
                           <div className="unread-dot"></div>
                         </div>
                       ))
                   )}
                 </div>
                 
                 {/* Show read notifications history (collapsed by default) */}
                 {notifications.filter(n => n.read).length > 0 && (
                   <details className="read-notifications-history">
                     <summary className="history-summary">
                       <i className="fas fa-history"></i>
                       Show Read Notifications ({notifications.filter(n => n.read).length})
                     </summary>
                     <div className="read-notifications-list">
                       {notifications
                         .filter(notification => notification.read)
                         .slice(0, 20) // Show last 20 read notifications
                         .map(notification => (
                           <div 
                             key={notification.id} 
                             className="notification-item read"
                           >
                             <div className="notification-icon">
                               <i className={getNotificationIcon(notification.type)}></i>
                             </div>
                             <div className="notification-content">
                               <div className="notification-title">{notification.title}</div>
                               <div className="notification-message">{notification.message}</div>
                               <div className="notification-time">
                                 {formatNotificationTime(notification.createdAt)}
                               </div>
                             </div>
                           </div>
                         ))}
                     </div>
                   </details>
                 )}
               </div>

                             {/* Current Status */}
               <div className="setting-section status-section">
                 <h3>Current Status</h3>
                 <div className="status-grid">
                   <div className="status-item">
                     <span className="status-label">Push Notifications:</span>
                     <span className={`status-value ${notificationSettings.pushNotifications ? 'active' : 'inactive'}`}>
                       {notificationSettings.pushNotifications ? 'Enabled' : 'Disabled'}
                     </span>
                   </div>
                   <div className="status-item">
                     <span className="status-label">Mentorship Requests:</span>
                     <span className={`status-value ${notificationSettings.mentorshipRequests && notificationSettings.pushNotifications ? 'active' : 'inactive'}`}>
                       {notificationSettings.mentorshipRequests && notificationSettings.pushNotifications ? 'Enabled' : 'Disabled'}
                     </span>
                   </div>
                   <div className="status-item">
                     <span className="status-label">Messages:</span>
                     <span className={`status-value ${notificationSettings.messages && notificationSettings.pushNotifications ? 'active' : 'inactive'}`}>
                       {notificationSettings.messages && notificationSettings.pushNotifications ? 'Enabled' : 'Disabled'}
                     </span>
                   </div>
                   <div className="status-item">
                     <span className="status-label">Likes & Comments:</span>
                     <span className={`status-value ${notificationSettings.likesAndComments && notificationSettings.pushNotifications ? 'active' : 'inactive'}`}>
                       {notificationSettings.likesAndComments && notificationSettings.pushNotifications ? 'Enabled' : 'Disabled'}
                     </span>
                   </div>
                   <div className="status-item">
                     <span className="status-label">Snooze Status:</span>
                     <span className={`status-value ${isSnoozed ? 'snoozed' : 'active'}`}>
                       {isSnoozed ? `Snoozed (${getSnoozeStatus()})` : 'Active'}
                     </span>
                   </div>
                   <div className="status-item">
                     <span className="status-label">Notifications:</span>
                     <span className="status-value active">
                       {notifications.filter(n => !n.read).length} unread / {notifications.length} total
                     </span>
                   </div>
                 </div>
               </div>
            </div>

            {/* Profile Section */}
            <div className={`settings-section ${activeSection === 'profile' ? 'active' : ''}`}>
              <div className="section-header">
                <h1 className="section-title">Edit Profile</h1>
                <p className="section-subtitle">Update your profile information</p>
              </div>

              {showProfileSuccess && (
                <div className="success-message show">
                  <i className="fas fa-check-circle"></i>
                  Your profile has been updated successfully! Changes will be visible in your profile and other users can see your updated information.
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div className="profile-picture-section">
                  <div className="profile-picture">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="Profile Picture" />
                    ) : currentUser?.profilePictureUrl ? (
                      <img src={currentUser.profilePictureUrl} alt="Profile Picture" />
                    ) : (
                      getUserInitials()
                    )}
                  </div>
                  <div className="picture-upload">
                    <button 
                      type="button" 
                      className="upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-camera"></i> Upload Photo
                    </button>
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={handleRemovePicture}
                    >
                      Remove Photo
                    </button>
                    <input 
                      ref={fileInputRef}
                      id="profilePictureUpload"
                      name="profilePictureUpload"
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={handlePictureUpload}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="first-name">First Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="first-name"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileInputChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="last-name">Last Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="last-name"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileInputChange}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileInputChange}
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="batch">Batch Year</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="batch"
                      name="batch"
                      value={profileData.batch}
                      onChange={handleProfileInputChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="course">Course/Major</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="course"
                      name="course"
                      value={profileData.course}
                      onChange={handleProfileInputChange}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bio">Bio</label>
                  <textarea 
                    className="form-control" 
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileInputChange}
                    placeholder="Tell us about yourself..."
                  ></textarea>
                </div>

                <div className="btn-group">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={resetProfileForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Security Section */}
            <div className={`settings-section ${activeSection === 'security' ? 'active' : ''}`}>
              <div className="section-header">
                <h1 className="section-title">Change Password</h1>
                <p className="section-subtitle">Update your password to keep your account secure</p>
              </div>

              {showSecuritySuccess && (
                <div className="success-message show">
                  Your password has been changed successfully.
                </div>
              )}

              <form onSubmit={handleSecuritySubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="current-password">Current Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="current-password"
                    name="currentPassword"
                    value={securityData.currentPassword}
                    onChange={handleSecurityInputChange}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="new-password"
                    name="newPassword"
                    value={securityData.newPassword}
                    onChange={handleSecurityInputChange}
                    required 
                  />
                  {securityData.newPassword && (
                    <div className="password-strength" style={{ marginTop: '8px' }}>
                      <div className="strength-bar">
                        <div 
                          className="strength-fill" 
                          style={{ 
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <div className="strength-text" style={{ color: passwordStrength.color, fontSize: '12px', marginTop: '4px' }}>
                        {passwordStrength.label} - {passwordStrength.feedback}
                      </div>
                    </div>
                  )}
                  <div className="form-text">Password must be at least 8 characters long with uppercase, lowercase, number, and special character</div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    id="confirm-password"
                    name="confirmPassword"
                    value={securityData.confirmPassword}
                    onChange={handleSecurityInputChange}
                    required 
                  />
                </div>

                <div className="btn-group">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Changing...' : 'Change Password'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={resetSecurityForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationSettings;
