import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  SidebarProvider, 
  DesktopSidebar, 
  SidebarLink 
} from './ui/sidebar';
import { 
  IconLayoutDashboard, 
  IconUsers, 
  IconMessageCircle, 
  IconCalendar, 
  IconSettings, 
  IconChevronLeft,
  IconLogout
} from '@tabler/icons-react';

const DashboardLayout = ({ children, userRole = 'student' }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const menuItems = [
    {
      icon: <IconLayoutDashboard size={20} />,
      label: 'Dashboard',
      href: userRole === 'alumni' ? '/alumni-dashboard' : '/student-dashboard',
    },
    {
      icon: <IconUsers size={20} />,
      label: 'Mentors',
      href: '/browse-mentors',
    },
    {
      icon: <IconMessageCircle size={20} />,
      label: 'Forum',
      href: '/forum',
    },
    {
      icon: <IconCalendar size={20} />,
      label: 'Events',
      href: '/events',
    },
  ];

  return (
    <SidebarProvider open={isSidebarOpen} setOpen={setIsSidebarOpen}>
      <div className="dashboard-layout">
        <DesktopSidebar className="new-sidebar">
          {/* Top Logo */}
          <div className="sidebar-top">
            <div className="sidebar-logo">
              <div className="logo-icon">C</div>
              <span className="logo-text">Connectrix</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="sidebar-nav">
            {menuItems.map((item, index) => (
              <SidebarLink
                key={index}
                link={item}
                className="sidebar-menu-item"
              />
            ))}
          </div>

          {/* Bottom Section with Settings and User */}
          <div className="sidebar-bottom">
            {/* Settings */}
            <SidebarLink
              link={{
                icon: <IconSettings size={20} />,
                label: 'Settings',
                href: '/profile',
              }}
              className="sidebar-menu-item"
            />

            {/* User Profile */}
            <div className="user-profile">
              <div className="user-avatar">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </div>
              <div className="user-info">
                <div className="user-name">{currentUser?.displayName || 'User'}</div>
                <div className="user-role">{userRole === 'alumni' ? 'Alumni' : 'Student'}</div>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <IconLogout size={18} />
              </button>
            </div>

            {/* Collapse Arrow */}
            <button 
              className="collapse-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <IconChevronLeft size={20} />
            </button>
          </div>
        </DesktopSidebar>

        {/* Main Content */}
        <div className="main-content">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
