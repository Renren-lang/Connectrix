import React, { useState, useEffect } from 'react';
import YouTubeHeader from './YouTubeHeader';
import './YouTubeLayout.css';

const YouTubeLayout = ({ children, currentPage = 'Home' }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="youtube-layout">
      {/* Header */}
      <YouTubeHeader 
        onSidebarToggle={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main 
        className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
      >
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default YouTubeLayout;

