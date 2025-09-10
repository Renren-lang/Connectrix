import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardLayout = ({ children, userRole = 'student' }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const menuItems = [
    {
      icon: '📊',
      label: 'Dashboard',
      onClick: () => navigate(userRole === 'alumni' ? '/alumni-dashboard' : '/student-dashboard'),
    },
    {
      icon: '👥',
      label: 'Mentors',
      onClick: () => navigate('/browse-mentors'),
    },
    {
      icon: '💬',
      label: 'Forum',
      onClick: () => navigate('/forum'),
    },
    {
      icon: '📅',
      label: 'Events',
      onClick: () => navigate('/events'),
    },
    {
      icon: '⚙️',
      label: 'Settings',
      onClick: () => navigate('/profile'),
    },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">C</div>
            {isSidebarOpen && <span className="logo-text">Connectrix</span>}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isSidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="sidebar-menu-item"
                onClick={item.onClick}
                title={!isSidebarOpen ? item.label : ''}
              >
                <span className="menu-icon">{item.icon}</span>
                {isSidebarOpen && <span className="menu-label">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            {isSidebarOpen && (
              <div className="user-info">
                <div className="user-name">{currentUser?.displayName || 'User'}</div>
                <div className="user-role">{userRole === 'alumni' ? 'Alumni' : 'Student'}</div>
              </div>
            )}
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
