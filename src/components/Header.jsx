import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

function Header() {
  const location = useLocation();
  const { currentUser, logout, userRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for unread messages and notifications in real-time
  useEffect(() => {
    if (!currentUser) return;

    let totalUnread = 0;
    let unsubscribeChats, unsubscribeNotifications;

    // Listen for unread messages in chats
    const chatsRef = collection(db, 'chats');
    const chatsQuery = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    unsubscribeChats = onSnapshot(chatsQuery, async (snapshot) => {
      let chatUnread = 0;
      
      // Check each chat for unread messages
      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data();
        const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
        
        if (otherUserId && chatData.lastMessageSenderId === otherUserId && !chatData.lastMessageRead) {
          chatUnread++;
        }
      }
      
      // Update total count
      totalUnread = chatUnread;
      console.log('Unread messages count:', chatUnread);
    }, (error) => {
      console.error('Error listening to unread messages:', error);
    });

    // Listen for unread notifications
    const notificationsRef = collection(db, 'notifications');
    let notificationsQuery;
    
    try {
      // Try with orderBy first (needs Firebase index)
      notificationsQuery = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );
    } catch (queryError) {
      console.warn('Notification query with orderBy failed, using fallback:', queryError);
      // Fallback without orderBy
      notificationsQuery = query(
        notificationsRef,
        where('recipientId', '==', currentUser.uid),
        where('read', '==', false)
      );
    }

    unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationUnread = snapshot.docs.length;
      
      // Update total count (messages + notifications)
      setUnreadCount(totalUnread + notificationUnread);
      console.log('Unread notifications count:', notificationUnread);
      console.log('Total unread count:', totalUnread + notificationUnread);
    }, (error) => {
      console.error('Error listening to notifications:', error);
      // Still show chat unread count even if notifications fail
      setUnreadCount(totalUnread);
    });

    // Cleanup function
    return () => {
      if (unsubscribeChats) unsubscribeChats();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to="/">
              <span className="logo-text">Connectrix</span>
            </Link>
          </div>

          {/* Navigation Menu - Only show on landing page */}
          {location.pathname === '/' && (
            <nav className="nav-menu">
              <a href="#features">Features</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>
          )}

          {/* Header Actions */}
          <div className="header-actions">
            {/* Show user info when logged in */}
            {currentUser ? (
              <>
                {/* Notification Icon - Only show when logged in */}
                {currentUser && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register' && (
                  <Link to="/notification-settings" className="notification-icon">
                    <i className="fas fa-bell"></i>
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </Link>
                )}
              </>
            ) : (
              /* Show login/register buttons only on landing page */
              location.pathname === '/' && (
                <>
                  <Link to="/login" className="btn btn-primary">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-secondary">
                    Register
                  </Link>
                </>
              )
            )}


          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
