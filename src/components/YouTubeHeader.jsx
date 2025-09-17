import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImage from './Logo2.png';
import './YouTubeHeader.css';

const YouTubeHeader = ({ onSidebarToggle, sidebarCollapsed }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Handle search logic here
      console.log('Searching for:', searchQuery);
    }
  };

  const handleVoiceSearch = () => {
    // Handle voice search logic
    console.log('Voice search activated');
  };

  const handleProfileClick = () => {
    if (currentUser) {
      navigate(`/profile/${currentUser.uid}`);
    }
  };

  return (
    <header className="youtube-header">
      <div className="header-left">
        {/* Menu Button */}
        <button 
          className="header-button menu-button"
          onClick={onSidebarToggle}
          aria-label="Toggle sidebar"
        >
          <span className="material-icons">menu</span>
        </button>
        
        {/* Connectrix Logo */}
        <div className="youtube-logo" onClick={() => navigate('/')}>
          <img 
            src={logoImage} 
            alt="Connectrix Logo" 
            style={{
              height: '50px',
              width: '50px',
              objectFit: 'cover',
              borderRadius: '12px',
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '4px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.08)';
              e.target.style.filter = 'drop-shadow(0 5px 10px rgba(0, 0, 0, 0.4)) brightness(1.2)';
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.filter = 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3)) brightness(1.1)';
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          <div className="logo-text">
            <span className="youtube-text" style={{ color: '#2563eb', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>CONNECTRIX</span>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="header-center">
        <form className="search-form" onSubmit={handleSearch}>
          <div className={`search-container ${isSearchFocused ? 'focused' : ''}`}>
            <input
              id="youtube-search"
              name="youtubeSearch"
              type="text"
              className="search-input"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            <button 
              type="submit" 
              className="search-button"
              aria-label="Search"
            >
              <span className="material-icons">search</span>
            </button>
          </div>
        </form>
        
        <button 
          className="header-button voice-search-button"
          onClick={handleVoiceSearch}
          aria-label="Search with your voice"
        >
          <span className="material-icons">mic</span>
        </button>
      </div>

      {/* Right Section */}
      <div className="header-right">
        <button className="header-button create-button" aria-label="Create">
          <span className="material-icons">add</span>
        </button>
        
        <button className="header-button notifications-button" aria-label="Notifications">
          <span className="material-icons">notifications</span>
          <span className="notification-badge">9+</span>
        </button>
        
        <button 
          className="header-button profile-button" 
          aria-label="Your account"
          onClick={handleProfileClick}
        >
          <div className="profile-avatar">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                className="profile-image"
              />
            ) : currentUser?.profilePictureBase64 ? (
              <img 
                src={currentUser.profilePictureBase64} 
                alt="Profile" 
                className="profile-image"
              />
            ) : (
              <span className="material-icons">account_circle</span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

export default YouTubeHeader;
