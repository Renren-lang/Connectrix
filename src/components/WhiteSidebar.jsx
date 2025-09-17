import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './WhiteSidebar.css';

const WhiteSidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const mainMenuItems = [
    { id: 'home', icon: 'home', label: 'Home', path: '/student-dashboard' },
    { id: 'forum', icon: 'forum', label: 'Forum', path: '/forum' },
    { id: 'find-mentors', icon: 'people', label: 'Find Mentors', path: '/browse-mentor' },
    { id: 'events-calendar', icon: 'event', label: 'Events Calendar', path: '/events' },
  ];

  const messageItems = [
    { id: 'messages', icon: 'message', label: 'Messages', path: '/messaging' },
  ];

  const settingsItems = [
    { id: 'settings', icon: 'settings', label: 'Settings', path: '/notification-settings' },
    { id: 'logout', icon: 'logout', label: 'Logout', path: '/logout', isLogout: true },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className={`white-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <span className="material-icons">menu</span>
        </button>
        {!isCollapsed && (
          <div className="logo-section">
            <div className="logo-icon">📺</div>
            <span className="logo-text">Connectrix</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {mainMenuItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="material-icons nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      {/* Messages Section */}
      <div className="messages-section">
        {messageItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="material-icons nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      {/* Bottom Section */}
      <div className="sidebar-bottom">
        {/* Settings and Logout */}
        {settingsItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${isActive(item.path) ? 'active' : ''} ${item.isLogout ? 'logout-item' : ''}`}
            onClick={() => item.isLogout ? handleLogout() : navigate(item.path)}
          >
            <span className="material-icons nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </div>
        ))}

        {/* User Profile Section */}
        {!isCollapsed && currentUser && (
          <div className="user-profile-section">
            <div className="user-avatar">
              {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{currentUser.displayName || 'User'}</div>
              <div className="user-role">{currentUser.role || 'Student'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhiteSidebar;
