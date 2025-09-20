import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import YouTubeStyleLayout from '../components/YouTubeStyleLayout';
import './NotificationSettings.css';

function NotificationSettings() {
  const { currentUser, logout, updateUserProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State for active section - default to notifications
  const [activeSection, setActiveSection] = useState('notifications');
  
  // Enhanced notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    // Main toggles
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    
    // Specific notification types
    mentorshipRequests: true,
    messages: true,
    likesAndComments: true,
    forumPosts: true,
    events: true,
    announcements: true,
    profileViews: false,
    connectionRequests: true,
    
    // Timing preferences
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Frequency settings
    digestFrequency: 'daily', // daily, weekly, never
    instantNotifications: true,
    
    // Snooze settings
    snoozeUntil: null,
    snoozeAll: false
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
  
  
  const [snoozeOptions] = useState([
    { value: 0.5, label: '30 minutes', icon: '⏰' },
    { value: 1, label: '1 hour', icon: '⏱️' },
    { value: 2, label: '2 hours', icon: '🕐' },
    { value: 4, label: '4 hours', icon: '🕓' },
    { value: 8, label: '8 hours', icon: '🕗' },
    { value: 12, label: '12 hours', icon: '🕛' },
    { value: 24, label: '1 day', icon: '📅' },
    { value: 48, label: '2 days', icon: '📆' },
    { value: 168, label: '1 week', icon: '🗓️' }
  ]);

  const [digestOptions] = useState([
    { value: 'instant', label: 'Instant', description: 'Get notified immediately' },
    { value: 'daily', label: 'Daily Digest', description: 'Once per day summary' },
    { value: 'weekly', label: 'Weekly Digest', description: 'Once per week summary' },
    { value: 'never', label: 'Never', description: 'No digest emails' }
  ]);

  const [timezoneOptions] = useState([
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
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
      // Get the current user from Firebase Auth directly
      let firebaseUser = auth.currentUser;
      console.log('Firebase user:', firebaseUser);
      
      if (!firebaseUser) {
        throw new Error('No authenticated user found. Please log in again.');
      }
      
      console.log('Re-authenticating user...');
      
      try {
        // Try direct re-authentication first
        const credential = EmailAuthProvider.credential(
          firebaseUser.email,
          securityData.currentPassword
        );
        
        await reauthenticateWithCredential(firebaseUser, credential);
        console.log('User re-authenticated successfully');
      } catch (reauthError) {
        console.log('Direct re-authentication failed, trying sign-in method:', reauthError);
        
        // Fallback: Sign in again to refresh the user object
        const signInResult = await signInWithEmailAndPassword(
          auth,
          firebaseUser.email,
          securityData.currentPassword
        );
        
        firebaseUser = signInResult.user;
        console.log('User re-authenticated via sign-in method');
      }
      
      console.log('Updating password...');
      // Update password using the re-authenticated user
      await updatePassword(firebaseUser, securityData.newPassword);
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
      console.error('Full error object:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/wrong-password') {
        alert('Current password is incorrect. Please try again.');
      } else if (error.code === 'auth/weak-password') {
        alert('New password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/requires-recent-login') {
        alert('For security reasons, please log out and log back in before changing your password.');
      } else if (error.message.includes('_updateTokensIfNecessary')) {
        alert('Authentication error. Please log out and log back in, then try changing your password again.');
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

  const handleSettingChange = (setting, value) => {
    const newSettings = {
      ...notificationSettings,
      [setting]: value
    };
    setNotificationSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const handleQuietHoursToggle = () => {
    const newSettings = {
      ...notificationSettings,
      quietHours: !notificationSettings.quietHours
    };
    setNotificationSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const handleSnoozeAll = () => {
    const newSettings = {
      ...notificationSettings,
      snoozeAll: !notificationSettings.snoozeAll,
      snoozeUntil: !notificationSettings.snoozeAll ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
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






  return (
    <YouTubeStyleLayout currentPage="Settings">
      <div className="notification-settings">
        <div className="settings-container">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Manage your notification preferences, profile, and security for Connectrix</p>
          </div>

          <div className="settings-content">
            {/* Settings Navigation */}
            <div className="settings-nav">
              <div className="nav-tabs">
                <button 
                  className={`nav-tab ${activeSection === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveSection('notifications')}
                >
                  <i className="fas fa-bell"></i>
                  <span>Notifications</span>
                </button>
                <button 
                  className={`nav-tab ${activeSection === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveSection('profile')}
                >
                  <i className="fas fa-user"></i>
                  <span>Edit Profile</span>
                </button>
                <button 
                  className={`nav-tab ${activeSection === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveSection('security')}
                >
                  <i className="fas fa-shield-alt"></i>
                  <span>Change Password</span>
                </button>
              </div>
            </div>

            {/* Enhanced Notifications Section */}
            <div className={`settings-section ${activeSection === 'notifications' ? 'active' : ''}`} style={{display: activeSection === 'notifications' ? 'block' : 'none'}}>
              <div className="section-header">
                <h1 className="section-title">🔔 Notification Settings</h1>
                <p className="section-subtitle">Customize how and when you receive notifications</p>
              </div>

              {/* Main Notification Toggles */}
              <div className="setting-section main-toggles">
                <div className="section-title-bar">
                  <h3>📱 Notification Channels</h3>
                  <p>Choose how you want to receive notifications</p>
                </div>
                
                <div className="toggle-grid">
                  <div className="toggle-card">
                    <div className="toggle-info">
                      <div className="toggle-icon">📱</div>
                      <div className="toggle-details">
                        <h4>Push Notifications</h4>
                        <p>Browser and mobile push notifications</p>
                      </div>
                    </div>
                    <label className="toggle-switch large">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={() => handleToggle('pushNotifications')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-card">
                    <div className="toggle-info">
                      <div className="toggle-icon">📧</div>
                      <div className="toggle-details">
                        <h4>Email Notifications</h4>
                        <p>Receive notifications via email</p>
                      </div>
                    </div>
                    <label className="toggle-switch large">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={() => handleToggle('emailNotifications')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-card">
                    <div className="toggle-info">
                      <div className="toggle-icon">💬</div>
                      <div className="toggle-details">
                        <h4>SMS Notifications</h4>
                        <p>Text message notifications (if available)</p>
                      </div>
                    </div>
                    <label className="toggle-switch large">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={() => handleToggle('smsNotifications')}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Specific Notification Types */}
              <div className="setting-section notification-types">
                <div className="section-title-bar">
                  <h3>🎯 Notification Types</h3>
                  <p>Choose which activities trigger notifications</p>
                </div>
                
                <div className="notification-grid">
                  {[
                    { key: 'mentorshipRequests', icon: '🤝', title: 'Mentorship Requests', desc: 'When students request mentorship' },
                    { key: 'messages', icon: '💬', title: 'Messages', desc: 'New chats and direct messages' },
                    { key: 'likesAndComments', icon: '❤️', title: 'Likes & Comments', desc: 'Activity on your posts' },
                    { key: 'forumPosts', icon: '📝', title: 'Forum Posts', desc: 'New posts in forums you follow' },
                    { key: 'events', icon: '📅', title: 'Events', desc: 'Upcoming events and reminders' },
                    { key: 'announcements', icon: '📢', title: 'Announcements', desc: 'Important platform updates' },
                    { key: 'profileViews', icon: '👀', title: 'Profile Views', desc: 'When someone views your profile' },
                    { key: 'connectionRequests', icon: '🔗', title: 'Connections', desc: 'New connection requests' }
                  ].map(notification => (
                    <div key={notification.key} className="notification-item">
                      <div className="notification-info">
                        <div className="notification-icon">{notification.icon}</div>
                        <div className="notification-details">
                          <h4>{notification.title}</h4>
                          <p>{notification.desc}</p>
                        </div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notificationSettings[notification.key] && notificationSettings.pushNotifications}
                          onChange={() => handleToggle(notification.key)}
                          disabled={!notificationSettings.pushNotifications}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timing Preferences */}
              <div className="setting-section timing-preferences">
                <div className="section-title-bar">
                  <h3>⏰ Timing Preferences</h3>
                  <p>Control when you receive notifications</p>
                </div>

                <div className="timing-grid">
                  <div className="timing-card">
                    <div className="timing-header">
                      <h4>🌙 Quiet Hours</h4>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notificationSettings.quietHours}
                          onChange={handleQuietHoursToggle}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    {notificationSettings.quietHours && (
                      <div className="time-inputs">
                        <div className="time-input-group">
                          <label>Start Time</label>
                          <input
                            type="time"
                            value={notificationSettings.quietStart}
                            onChange={(e) => handleSettingChange('quietStart', e.target.value)}
                          />
                        </div>
                        <div className="time-input-group">
                          <label>End Time</label>
                          <input
                            type="time"
                            value={notificationSettings.quietEnd}
                            onChange={(e) => handleSettingChange('quietEnd', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="timing-card">
                    <div className="timing-header">
                      <h4>📧 Digest Frequency</h4>
                    </div>
                    <div className="digest-options">
                      {digestOptions.map(option => (
                        <label key={option.value} className="digest-option">
                          <input
                            type="radio"
                            name="digestFrequency"
                            value={option.value}
                            checked={notificationSettings.digestFrequency === option.value}
                            onChange={(e) => handleSettingChange('digestFrequency', e.target.value)}
                          />
                          <div className="digest-info">
                            <span className="digest-label">{option.label}</span>
                            <span className="digest-desc">{option.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Snooze Controls */}
              <div className="setting-section snooze-controls">
                <div className="section-title-bar">
                  <h3>😴 Snooze Controls</h3>
                  <p>Temporarily pause notifications</p>
                </div>

                <div className="snooze-grid">
                  <div className="snooze-card">
                    <div className="snooze-header">
                      <h4>⏸️ Quick Snooze</h4>
                      <p>Pause notifications for a specific duration</p>
                    </div>
                    <div className="snooze-options-grid">
                      {snoozeOptions.map(option => (
                        <button
                          key={option.value}
                          className={`snooze-option-btn ${isSnoozed ? 'disabled' : ''}`}
                          onClick={() => handleSnooze(option.value)}
                          disabled={isSnoozed}
                        >
                          <span className="snooze-icon">{option.icon}</span>
                          <span className="snooze-label">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="snooze-card">
                    <div className="snooze-header">
                      <h4>🔕 Snooze All</h4>
                      <p>Pause all notifications temporarily</p>
                    </div>
                    <div className="snooze-all-controls">
                      <label className="toggle-switch large">
                        <input
                          type="checkbox"
                          checked={notificationSettings.snoozeAll}
                          onChange={handleSnoozeAll}
                        />
                        <span className="slider"></span>
                      </label>
                      {isSnoozed && (
                        <div className="snooze-status">
                          <p>⏰ Snoozed until: {getSnoozeStatus()}</p>
                          <button 
                            className="btn btn-primary clear-snooze-btn"
                            onClick={clearSnooze}
                          >
                            Clear Snooze
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Summary */}
              <div className="setting-section notification-summary">
                <div className="section-title-bar">
                  <h3>📊 Notification Summary</h3>
                  <p>Current notification status overview</p>
                </div>
                
                <div className="summary-grid">
                  <div className="summary-card">
                    <div className="summary-icon">📱</div>
                    <div className="summary-details">
                      <h4>Push Notifications</h4>
                      <span className={`status-badge ${notificationSettings.pushNotifications ? 'active' : 'inactive'}`}>
                        {notificationSettings.pushNotifications ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <div className="summary-icon">📧</div>
                    <div className="summary-details">
                      <h4>Email Notifications</h4>
                      <span className={`status-badge ${notificationSettings.emailNotifications ? 'active' : 'inactive'}`}>
                        {notificationSettings.emailNotifications ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <div className="summary-icon">🌙</div>
                    <div className="summary-details">
                      <h4>Quiet Hours</h4>
                      <span className={`status-badge ${notificationSettings.quietHours ? 'active' : 'inactive'}`}>
                        {notificationSettings.quietHours ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="summary-card">
                    <div className="summary-icon">😴</div>
                    <div className="summary-details">
                      <h4>Snooze Status</h4>
                      <span className={`status-badge ${isSnoozed ? 'snoozed' : 'active'}`}>
                        {isSnoozed ? 'Snoozed' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className={`settings-section ${activeSection === 'profile' ? 'active' : ''}`} style={{display: activeSection === 'profile' ? 'block' : 'none'}}>
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
            <div className={`settings-section ${activeSection === 'security' ? 'active' : ''}`} style={{display: activeSection === 'security' ? 'block' : 'none'}}>
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
    </YouTubeStyleLayout>
  );
}

export default NotificationSettings;
