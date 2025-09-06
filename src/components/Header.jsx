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
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    console.log('Setting up listeners for user:', currentUser.uid);
    let totalUnread = 0;
    let unsubscribeChats, unsubscribeNotifications;

    // Listen for unread messages in chats
    const chatsRef = collection(db, 'chats');
    const chatsQuery = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    unsubscribeChats = onSnapshot(chatsQuery, async (snapshot) => {
      try {
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
      } catch (error) {
        console.error('Error processing chat data:', error);
      }
    }, (error) => {
      console.error('Error listening to unread messages:', error);
      console.error('Error details:', error.code, error.message);
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
      try {
        const notificationUnread = snapshot.docs.length;
        
        // Debug: Log notification details
        console.log('Unread notifications:', snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
        
        // Update total count (messages + notifications)
        setUnreadCount(totalUnread + notificationUnread);
        console.log('Unread notifications count:', notificationUnread);
        console.log('Total unread count:', totalUnread + notificationUnread);
      } catch (error) {
        console.error('Error processing notification data:', error);
      }
    }, (error) => {
      console.error('Error listening to notifications:', error);
      console.error('Error details:', error.code, error.message);
      // Still show chat unread count even if notifications fail
      setUnreadCount(totalUnread);
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up listeners...');
      if (unsubscribeChats) {
        try {
          unsubscribeChats();
        } catch (error) {
          console.error('Error unsubscribing from chats:', error);
        }
      }
      if (unsubscribeNotifications) {
        try {
          unsubscribeNotifications();
        } catch (error) {
          console.error('Error unsubscribing from notifications:', error);
        }
      }
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
