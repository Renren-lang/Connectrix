import React from 'react';
import YouTubeLayout from '../components/YouTubeLayout';
import '../components/YouTubeHeader.css';
import '../components/YouTubeLayout.css';

const YouTubeStyleDemo = () => {
  return (
    <YouTubeLayout currentPage="Home">
      <div className="demo-content">
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#030303', 
          marginBottom: '16px' 
        }}>
          YouTube-Style Layout Demo
        </h1>
        
        <p style={{ 
          fontSize: '14px', 
          color: '#606060', 
          marginBottom: '24px',
          lineHeight: '1.4'
        }}>
          This is a demo of the YouTube-style layout with responsive sidebar and header.
          Try resizing your browser window to see how it adapts to different screen sizes.
        </p>

        {/* Video Grid Demo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
          marginTop: '24px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer'
            }}>
              {/* Video Thumbnail */}
              <div style={{
                width: '100%',
                height: '180px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: '#cccccc'
              }}>
                📹
              </div>
              
              {/* Video Info */}
              <div style={{ padding: '12px' }}>
                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>
                  {/* Channel Avatar */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    👤
                  </div>
                  
                  {/* Video Details */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#030303',
                      margin: 0,
                      marginBottom: '4px',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      Sample Video Title {item} - This is a longer title that might wrap to multiple lines
                    </h3>
                    
                    <p style={{
                      fontSize: '12px',
                      color: '#606060',
                      margin: 0,
                      marginBottom: '2px'
                    }}>
                      Channel Name {item}
                    </p>
                    
                    <p style={{
                      fontSize: '12px',
                      color: '#606060',
                      margin: 0
                    }}>
                      1.2M views • 2 days ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature List */}
        <div style={{ marginTop: '48px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#030303', 
            marginBottom: '16px' 
          }}>
            Features
          </h2>
          
          <ul style={{
            fontSize: '14px',
            color: '#606060',
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li>Responsive sidebar that collapses on smaller screens</li>
            <li>YouTube-style header with search functionality</li>
            <li>Material Design icons and styling</li>
            <li>Dark mode support</li>
            <li>Mobile-first responsive design</li>
            <li>Smooth animations and transitions</li>
            <li>Accessibility features</li>
            <li>Touch-friendly interface</li>
          </ul>
        </div>

        {/* Instructions */}
        <div style={{ 
          marginTop: '48px',
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#030303', 
            marginBottom: '12px' 
          }}>
            How to Use
          </h3>
          
          <ol style={{
            fontSize: '14px',
            color: '#606060',
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li>Click the menu button (☰) to toggle the sidebar</li>
            <li>Use the search bar to search for content</li>
            <li>Navigate using the sidebar menu items</li>
            <li>Resize your browser to see responsive behavior</li>
            <li>Try the layout on different devices</li>
          </ol>
        </div>
      </div>
    </YouTubeLayout>
  );
};

export default YouTubeStyleDemo;

