import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import logoImage from './Logo2.png';
import NotificationPopup from './NotificationPopup';
import './DashboardHeader.css';

const DashboardHeader = ({ currentPage = 'Dashboard', toggleSidebar }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCategories, setSearchCategories] = useState({
    people: [],
    jobs: [],
    posts: [],
    events: []
  });
  const searchTimeoutRef = useRef(null);
  const searchRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  // Listen for notifications
  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notificationsData);
      
      // Count unread notifications (excluding messages)
      const unread = notificationsData.filter(notif => !notif.read && notif.type !== 'message').length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen for unread message count
  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalUnreadMessages = 0;
      
      snapshot.docs.forEach(doc => {
        const chatData = doc.data();
        // Check if the last message was sent by someone else and is unread
        if (chatData.lastMessageSenderId && 
            chatData.lastMessageSenderId !== currentUser.uid && 
            !chatData.lastMessageRead) {
          totalUnreadMessages++;
        }
      });
      
      setUnreadMessageCount(totalUnreadMessages);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time search functionality
  const performSearch = async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const searchTerm = query.toLowerCase();
      const results = {
        people: [],
        jobs: [],
        posts: [],
        events: []
      };

      // Search for people (mentors and students)
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      console.log('Searching for:', searchTerm);
      console.log('Total users found:', usersSnapshot.docs.length);
      
      // Debug: Log all users to see what data we have
      usersSnapshot.docs.forEach(doc => {
        const user = doc.data();
        console.log('User data:', {
          id: doc.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          course: user.course,
          industry: user.industry
        });
      });
      
      usersSnapshot.docs.forEach(doc => {
        const user = doc.data();
        const firstName = (user.firstName || '').toLowerCase();
        const lastName = (user.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const course = (user.course || '').toLowerCase();
        const industry = (user.industry || '').toLowerCase();
        const currentJob = (user.currentJob || '').toLowerCase();
        
        // More flexible name matching
        const nameMatch = fullName.includes(searchTerm) || 
                         firstName.includes(searchTerm) || 
                         lastName.includes(searchTerm) ||
                         fullName.split(' ').some(part => part.includes(searchTerm));
        const otherMatch = course.includes(searchTerm) || 
                          industry.includes(searchTerm) || 
                          currentJob.includes(searchTerm);
        
        if (nameMatch || otherMatch) {
          const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
          results.people.push({
            id: doc.id,
            name: displayName,
            role: user.role || 'user',
            course: user.course,
            industry: user.industry,
            currentJob: user.currentJob,
            avatar: (user.firstName?.charAt(0) || 'U') + (user.lastName?.charAt(0) || ''),
            type: 'person'
          });
          console.log('Found person:', displayName, 'Role:', user.role);
        }
      });
      
      console.log('People results:', results.people.length);
      
      // If no results found, show some users for testing
      if (results.people.length === 0 && searchTerm.length > 0) {
        console.log('No people found, showing first 3 users for testing');
        usersSnapshot.docs.slice(0, 3).forEach(doc => {
          const user = doc.data();
          const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
          results.people.push({
            id: doc.id,
            name: displayName,
            role: user.role || 'user',
            course: user.course,
            industry: user.industry,
            currentJob: user.currentJob,
            avatar: (user.firstName?.charAt(0) || 'U') + (user.lastName?.charAt(0) || ''),
            type: 'person'
          });
        });
      }

      // Search for forum posts
      const postsQuery = query(collection(db, 'forum-posts'), orderBy('createdAt', 'desc'), limit(10));
      const postsSnapshot = await getDocs(postsQuery);
      
      postsSnapshot.docs.forEach(doc => {
        const post = doc.data();
        const content = (post.content || '').toLowerCase();
        const category = (post.category || '').toLowerCase();
        const title = (post.title || '').toLowerCase();
        
        if (content.includes(searchTerm) || category.includes(searchTerm) || title.includes(searchTerm)) {
          results.posts.push({
            id: doc.id,
            title: post.title || 'Post',
            content: post.content,
            category: post.category,
            authorName: post.authorName,
            createdAt: post.createdAt,
            type: 'post'
          });
        }
      });

      // Search for events
      const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(10));
      const eventsSnapshot = await getDocs(eventsQuery);
      
      eventsSnapshot.docs.forEach(doc => {
        const event = doc.data();
        const title = (event.title || '').toLowerCase();
        const description = (event.description || '').toLowerCase();
        const location = (event.location || '').toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm) || location.includes(searchTerm)) {
          results.events.push({
            id: doc.id,
            title: event.title,
            description: event.description,
            location: event.location,
            date: event.date,
            type: 'event'
          });
        }
      });

      // Mock job suggestions based on search
      const jobSuggestions = [
        'Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
        'Marketing Manager', 'Sales Representative', 'Business Analyst',
        'Project Manager', 'DevOps Engineer', 'Full Stack Developer'
      ].filter(job => job.toLowerCase().includes(searchTerm));

      results.jobs = jobSuggestions.map(job => ({
        id: job,
        title: job,
        company: 'Various Companies',
        location: 'Remote/Hybrid',
        type: 'job'
      }));

      setSearchCategories(results);
      
      // Flatten results for display
      const allResults = [
        ...results.people.slice(0, 3),
        ...results.jobs.slice(0, 3),
        ...results.posts.slice(0, 3),
        ...results.events.slice(0, 3)
      ];
      
      setSearchResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleNotificationClick = () => {
    setShowNotificationPopup(true);
  };

  const handleProfileClick = () => {
    if (currentUser) {
      navigate(`/profile/${currentUser.uid}`);
    }
  };

  const handleMessageClick = () => {
    navigate('/messaging');
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        {/* Left Section - Hamburger, Logo and Area Label */}
        <div className="header-left">
          <button className="hamburger-button" onClick={toggleSidebar}>
            <span className="material-icons">menu</span>
          </button>
          <div className="logo-section" onClick={() => navigate('/')}>
            <img 
              src={logoImage} 
              alt="Connectrix Logo" 
              className="logo-icon"
            />
            <span className="logo-text">CONNECTRIX</span>
          </div>
          <div className="area-label">
            {currentPage}
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="header-center" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search mentors, students, jobs..."
                value={searchQuery}
                onChange={handleSearchInput}
                className="search-input"
                autoComplete="off"
              />
              <button type="submit" className="search-button">
                <span className="material-icons">search</span>
              </button>
              
              {/* Real-time Search Results Dropdown */}
              {showSearchResults && (
                <div className="search-results-dropdown">
                  {isSearching ? (
                    <div className="search-loading">
                      <div className="loading-spinner"></div>
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="search-results">
                      {/* People Results */}
                      {searchCategories.people.length > 0 && (
                        <div className="search-category">
                          <div className="category-header">
                            <i className="fas fa-users"></i>
                            <span>People</span>
                          </div>
                          {searchCategories.people.slice(0, 3).map(person => (
                            <div 
                              key={person.id} 
                              className="search-result-item person-item"
                              onClick={() => {
                                navigate(`/profile/${person.id}`);
                                setShowSearchResults(false);
                              }}
                            >
                              <div className="result-avatar">{person.avatar}</div>
                              <div className="result-content">
                                <div className="result-title">{person.name}</div>
                                <div className="result-subtitle">
                                  {person.role === 'alumni' ? 'Mentor' : 'Student'} • {person.industry || person.course}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Job Results */}
                      {searchCategories.jobs.length > 0 && (
                        <div className="search-category">
                          <div className="category-header">
                            <i className="fas fa-briefcase"></i>
                            <span>Jobs</span>
                          </div>
                          {searchCategories.jobs.slice(0, 3).map(job => (
                            <div 
                              key={job.id} 
                              className="search-result-item job-item"
                              onClick={() => {
                                // Navigate to jobs page or show job details
                                navigate('/browse-mentor');
                                setShowSearchResults(false);
                              }}
                            >
                              <div className="result-icon">
                                <i className="fas fa-briefcase"></i>
                              </div>
                              <div className="result-content">
                                <div className="result-title">{job.title}</div>
                                <div className="result-subtitle">{job.company} • {job.location}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Posts Results */}
                      {searchCategories.posts.length > 0 && (
                        <div className="search-category">
                          <div className="category-header">
                            <i className="fas fa-comment"></i>
                            <span>Posts</span>
                          </div>
                          {searchCategories.posts.slice(0, 3).map(post => (
                            <div 
                              key={post.id} 
                              className="search-result-item post-item"
                              onClick={() => {
                                navigate('/forum');
                                setShowSearchResults(false);
                              }}
                            >
                              <div className="result-icon">
                                <i className="fas fa-comment"></i>
                              </div>
                              <div className="result-content">
                                <div className="result-title">{post.title}</div>
                                <div className="result-subtitle">
                                  {post.category} • by {post.authorName}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Events Results */}
                      {searchCategories.events.length > 0 && (
                        <div className="search-category">
                          <div className="category-header">
                            <i className="fas fa-calendar"></i>
                            <span>Events</span>
                          </div>
                          {searchCategories.events.slice(0, 3).map(event => (
                            <div 
                              key={event.id} 
                              className="search-result-item event-item"
                              onClick={() => {
                                navigate('/events');
                                setShowSearchResults(false);
                              }}
                            >
                              <div className="result-icon">
                                <i className="fas fa-calendar"></i>
                              </div>
                              <div className="result-content">
                                <div className="result-title">{event.title}</div>
                                <div className="result-subtitle">{event.location} • {event.date}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="search-no-results">
                      <i className="fas fa-search"></i>
                      <span>No results found for "{searchQuery}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Section - Actions */}
        <div className="header-right">
          <button onClick={handleNotificationClick} className="notification-button">
            <span className="material-icons">notifications</span>
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={handleMessageClick} className="message-button">
            <svg className="messenger-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            {unreadMessageCount > 0 && (
              <span className="message-badge">
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </span>
            )}
          </button>
          <div onClick={handleProfileClick} className="profile-avatar">
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
              <div className="profile-initial">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Notification Popup */}
      <NotificationPopup 
        isOpen={showNotificationPopup}
        onClose={() => setShowNotificationPopup(false)}
      />
    </header>
  );
};

export default DashboardHeader;
