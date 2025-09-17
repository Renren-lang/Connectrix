import React, { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import WhiteSidebar from './WhiteSidebar';
import './YouTubeStyleLayout.css';

const YouTubeStyleLayout = ({ children, currentPage }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="youtube-layout">
      <WhiteSidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar}
        currentPage={currentPage}
      />
      <DashboardHeader currentPage={currentPage} toggleSidebar={toggleSidebar} />
      <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default YouTubeStyleLayout;
