import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import MentorStatusToggle from '../components/MentorStatusToggle';
import './BrowseMentor.css';

function BrowseMentor() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    skills: '',
    software: '',
    industry: '',
    price: '',
    sessionsBlocks: '',
    timesAvailable: '',
    daysAvailable: '',
    language: '',
    country: '',
    city: '',
    company: ''
  });
  const [activeSort, setActiveSort] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '' });
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);

  const totalPages = Math.ceil(filteredMentors.length / 10) || 1;

  // Fetch mentors from Firebase
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setIsLoading(true);
        console.log('Starting to fetch mentors...');
        console.log('Current user:', currentUser);
        
        // Check if user is authenticated
        if (!currentUser || !currentUser.uid) {
          throw new Error('User not authenticated');
        }
        
        // Query users collection for all alumni users
        const mentorsRef = collection(db, 'users');
        
        // Try the main query first (with orderBy - needs Firebase index)
        // To fix "Expected type 'Qp'" error: Go to Firebase Console → Firestore → Indexes → 
        // Create composite index: collection: 'users', fields: 'role' (ASC) + 'firstName' (ASC)
        let querySnapshot;
                try {
          const q = query(
            mentorsRef,
          where('role', '==', 'alumni'),
            orderBy('firstName', 'asc')
        );
        
          console.log('Executing main query with orderBy...');
          querySnapshot = await getDocs(q);
          console.log('Main query executed successfully, got', querySnapshot.docs.length, 'documents');
        } catch (queryError) {
          console.warn('Main query failed (likely missing index), falling back to basic query:', queryError);
          console.log('💡 To fix this permanently, create a Firebase index for: role (ASC) + firstName (ASC)');
          
          // Fallback: query without orderBy, then sort in JavaScript
          const fallbackQuery = query(
            mentorsRef,
            where('role', '==', 'alumni')
          );
          querySnapshot = await getDocs(fallbackQuery);
          console.log('Fallback query executed, got', querySnapshot.docs.length, 'documents');
        }
        
        // Convert docs to mentor data and filter for willing mentors
        let mentorsData = querySnapshot.docs
          .map(doc => {
          const data = doc.data();
            console.log('Processing mentor document:', doc.id, data);
          return {
            id: doc.id,
            ...data,
            initials: (data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '') || 'U',
              mentees: 0,
              rating: 5.0,
              tags: data.skills ? data.skills.split(',').map(skill => skill.trim()) : [],
              isWillingToMentor: data.willingToMentor !== undefined ? data.willingToMentor : true
            };
          })
          .filter(mentor => mentor.isWillingToMentor); // Filter for willing mentors
        
        // If we used fallback query (no orderBy), sort in JavaScript
        if (!querySnapshot.docs.length || mentorsData.length > 0) {
          try {
            mentorsData.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
            console.log('Sorted mentors in JavaScript by firstName');
          } catch (sortError) {
            console.warn('JavaScript sorting failed:', sortError);
            // Continue with unsorted data
          }
        }
        
        console.log('Fetched mentors:', mentorsData.length, mentorsData);
        
        setMentors(mentorsData);
        setFilteredMentors(mentorsData);
        setIsLoading(false);
              } catch (error) {
          console.error('Error fetching mentors:', error);
          setIsLoading(false);
        
        // Provide helpful error messages
        let errorMessage = 'Failed to load mentors';
        if (error.message.includes('Expected type')) {
          errorMessage = 'Database query error - please contact support or refresh the page';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied - please check your account status';
        } else {
          errorMessage = `Failed to load mentors: ${error.message}`;
        }
        
        setNotificationData({
          title: 'Error',
          message: errorMessage
        });
        setShowNotification(true);
      }
    };

    if (currentUser) {
    fetchMentors();
    }
  }, [currentUser]);

  // Filter and sort mentors
  useEffect(() => {
    let filtered = mentors.filter(mentor => {
      const matchesSearch = mentor.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mentor.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mentor.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mentor.skills?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mentor.experience?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSkills = !filters.skills || mentor.skills?.toLowerCase().includes(filters.skills.toLowerCase());
      const matchesSoftware = !filters.software || mentor.software?.toLowerCase().includes(filters.software.toLowerCase());
      const matchesIndustry = !filters.industry || mentor.industry?.toLowerCase().includes(filters.industry.toLowerCase());
      const matchesPrice = !filters.price || mentor.price === filters.price;
      const matchesSessionsBlocks = !filters.sessionsBlocks || mentor.sessionsBlocks === filters.sessionsBlocks;
      const matchesTimesAvailable = !filters.timesAvailable || mentor.timesAvailable === filters.timesAvailable;
      const matchesDaysAvailable = !filters.daysAvailable || mentor.daysAvailable === filters.daysAvailable;
      const matchesLanguage = !filters.language || mentor.language === filters.language;
      const matchesCountry = !filters.country || mentor.country === filters.country;
      const matchesCity = !filters.city || mentor.city === filters.city;
      const matchesCompany = !filters.company || mentor.company?.toLowerCase().includes(filters.company.toLowerCase());
      
      return matchesSearch && matchesSkills && matchesSoftware && matchesIndustry && 
             matchesPrice && matchesSessionsBlocks && matchesTimesAvailable && 
             matchesDaysAvailable && matchesLanguage && matchesCountry && 
             matchesCity && matchesCompany;
    });

    // Sort mentors
    switch (activeSort) {
      case 'name':
        filtered.sort((a, b) => (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName));
        break;
      case 'course':
        filtered.sort((a, b) => (a.course || '').localeCompare(b.course || ''));
        break;
      case 'batch':
        filtered.sort((a, b) => (a.batch || '').localeCompare(b.batch || ''));
        break;
      default:
        break;
    }

    setFilteredMentors(filtered);
    setCurrentPage(1);
  }, [mentors, searchTerm, filters, activeSort]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSort = (sortType) => {
    setActiveSort(sortType);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewProfile = (mentorId) => {
    navigate(`/profile/${mentorId}`);
  };

  const handleMessage = (mentorId, mentorName) => {
    const formattedName = mentorName?.trim() || 'Alumni User';
    navigate('/messaging', {
      state: {
        startChatWith: {
          id: mentorId,
          name: formattedName,
          role: 'alumni'
        }
      }
    });
  };

  const handleMentorshipRequest = async (mentorId, mentorName) => {
    if (!currentUser) {
      alert('Please log in to send a mentorship request.');
      return;
    }

    try {
      console.log('Creating mentorship request for mentor:', mentorId);
      
      // Create mentorship request
      const mentorshipRequest = {
        studentId: currentUser.uid,
        studentName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
        studentEmail: currentUser.email,
        mentorId: mentorId,
        mentorName: mentorName,
        status: 'pending', // pending, accepted, rejected
        message: `Hi ${mentorName}, I would like to request your mentorship. I'm interested in learning from your experience.`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to mentorship-requests collection
      const requestRef = await addDoc(collection(db, 'mentorship-requests'), mentorshipRequest);
      console.log('Mentorship request created with ID:', requestRef.id);

      // Create notification for the mentor
      const notification = {
        recipientId: mentorId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
        type: 'mentorship-request',
        title: 'New Mentorship Request',
        message: `${currentUser.displayName || 'A student'} has requested your mentorship`,
        data: {
          requestId: requestRef.id,
          studentId: currentUser.uid,
          studentName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student'
        },
        read: false,
        createdAt: serverTimestamp()
      };

      // Add notification to notifications collection
      await addDoc(collection(db, 'notifications'), notification);
      console.log('Notification sent to mentor');

      alert(`Mentorship request sent to ${mentorName}! They will be notified and can respond to your request.`);
      
    } catch (error) {
      console.error('Error creating mentorship request:', error);
      alert('Failed to send mentorship request. Please try again.');
    }
  };

  const handleRefreshMentors = () => {
    window.location.reload();
  };

  const showNotificationMessage = (title, message) => {
    setNotificationData({ title, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // Get current page mentors
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const sortedMentors = filteredMentors.slice(startIndex, endIndex);
  
  return (
    <div className="browse-mentor">
      <main className="main-content">
        <div className="container">
          {/* Header */}
          <div className="browse-header">
            <div className="header-content">
              <h1>Mentors</h1>
              <MentorStatusToggle />
            </div>
          </div>

          {/* Search and Filter Interface */}
          <div className="search-filter-card">
            {/* Search Bar */}
            <div className="search-bar">
                <i className="fas fa-search search-icon"></i>
                <input 
                  type="text" 
                placeholder="Search by name or keyword"
                  value={searchTerm}
                  onChange={handleSearch}
                className="search-input"
                />
              </div>

            {/* Filter Dropdowns */}
            <div className="filter-separator"></div>
            
            {/* First Row of Filters */}
            <div className="filter-row">
              <select 
                className="filter-dropdown"
                value={filters.skills}
                onChange={(e) => handleFilterChange('skills', e.target.value)}
              >
                <option value="">Skills</option>
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
                <option value="business">Business</option>
                <option value="data-analysis">Data Analysis</option>
              </select>

              <select 
                className="filter-dropdown"
                value={filters.software}
                onChange={(e) => handleFilterChange('software', e.target.value)}
              >
                <option value="">Software</option>
                <option value="react">React</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="figma">Figma</option>
                <option value="photoshop">Photoshop</option>
              </select>

              <select 
                className="filter-dropdown filter-active"
                value={filters.industry}
                onChange={(e) => handleFilterChange('industry', e.target.value)}
              >
                <option value="">Industry</option>
                <option value="technology">Technology</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="consulting">Consulting</option>
              </select>

              <select 
                className="filter-dropdown"
                value={filters.price}
                onChange={(e) => handleFilterChange('price', e.target.value)}
              >
                <option value="">Price</option>
                <option value="free">Free</option>
                <option value="low">$1-25/hour</option>
                <option value="medium">$26-50/hour</option>
                <option value="high">$51+/hour</option>
              </select>

              <select 
                className="filter-dropdown"
                value={filters.sessionsBlocks}
                onChange={(e) => handleFilterChange('sessionsBlocks', e.target.value)}
              >
                <option value="">Sessions Blocks</option>
                <option value="1">1 Session</option>
                <option value="3">3 Sessions</option>
                <option value="5">5 Sessions</option>
                <option value="10">10 Sessions</option>
              </select>

              <select 
                className="filter-dropdown"
                value={filters.timesAvailable}
                onChange={(e) => handleFilterChange('timesAvailable', e.target.value)}
              >
                <option value="">Times Available</option>
                <option value="morning">Morning (6AM-12PM)</option>
                <option value="afternoon">Afternoon (12PM-6PM)</option>
                <option value="evening">Evening (6PM-12AM)</option>
                <option value="flexible">Flexible</option>
              </select>

              <select 
                className="filter-dropdown"
                value={filters.daysAvailable}
                onChange={(e) => handleFilterChange('daysAvailable', e.target.value)}
              >
                <option value="">Days Available</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>

              <select 
                className="filter-dropdown"
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
              >
                <option value="">Language</option>
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="chinese">Chinese</option>
              </select>

                <select 
                className="filter-dropdown"
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
              >
                <option value="">Country</option>
                <option value="usa">United States</option>
                <option value="canada">Canada</option>
                <option value="uk">United Kingdom</option>
                <option value="australia">Australia</option>
                <option value="germany">Germany</option>
                </select>
              </div>

            {/* Second Row of Filters */}
            <div className="filter-row">
                <select 
                className="filter-dropdown"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              >
                <option value="">City</option>
                <option value="new-york">New York</option>
                <option value="san-francisco">San Francisco</option>
                <option value="london">London</option>
                <option value="toronto">Toronto</option>
                <option value="sydney">Sydney</option>
                </select>

                <select 
                className="filter-dropdown filter-premium"
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
              >
                <option value="">Company</option>
                <option value="google">Google</option>
                <option value="microsoft">Microsoft</option>
                <option value="apple">Apple</option>
                <option value="amazon">Amazon</option>
                <option value="meta">Meta</option>
                </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading mentors...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && mentors.length === 0 && (
            <div className="error-state">
              <div className="error-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 className="error-title">Failed to Load Mentors</h3>
              <p className="error-message">
                There was an issue loading the mentor list. This could be due to:
              </p>
              <ul className="error-details">
                <li>Permission issues with your account</li>
                <li>Network connectivity problems</li>
                <li>Firebase configuration issues</li>
              </ul>
              <div className="error-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleRefreshMentors}
                >
                  <i className="fas fa-sync-alt"></i> Try Again
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.location.reload()}
                >
                  <i className="fas fa-redo"></i> Reload Page
                </button>
              </div>
            </div>
          )}

          {/* Mentors Grid */}
          {!isLoading && mentors.length > 0 && (
            <>
                <div className="mentors-grid">
                  {sortedMentors.map(mentor => (
                    <div key={mentor.id} className="mentor-card">
                      <div className="mentor-header">
                        <div className="mentor-avatar">{mentor.initials}</div>
                        <div className="mentor-info">
                          <h3>{mentor.firstName} {mentor.lastName}</h3>
                          <div className="mentor-meta">
                            {mentor.course && `${mentor.course} • `}
                            {mentor.batch && `Batch ${mentor.batch}`}
                          </div>
                        </div>
                      </div>
                      <div className="mentor-body">
                        <p className="mentor-bio">{mentor.experience || 'No experience details available.'}</p>
                        <div className="mentor-stats">
                          <div className="stat-item">
                            <i className="fas fa-users"></i>
                            <span>{mentor.mentees || 0} Mentees</span>
                          </div>
                          <div className="stat-item">
                            <i className="fas fa-star"></i>
                            <span>{mentor.rating || 5.0} Rating</span>
                          </div>
                        </div>
                        <div className="mentor-tags">
                          {mentor.tags && mentor.tags.length > 0 ? (
                            mentor.tags.map((tag, index) => (
                              <span key={index} className="mentor-tag">{tag}</span>
                            ))
                          ) : (
                          <span className="mentor-tag">General Skills</span>
                          )}
                        <span className={`mentor-tag ${mentor.isWillingToMentor ? 'mentor-available' : 'mentor-limited'}`}>
                          {mentor.isWillingToMentor ? 'Available for Mentoring' : 'Limited Availability'}
                        </span>
                        </div>
                        <div className="mentor-actions">
                          <button 
                            className="btn-view"
                            onClick={() => handleViewProfile(mentor.id)}
                          >
                            View Profile
                          </button>
                                          <button 
                          className="btn-request"
                          onClick={() => handleMessage(mentor.id, `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim())}
                >
                  Message
                </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              {/* Pagination */}
              {sortedMentors.length > 0 && (
                <div className="pagination">
                  <button 
                    className="page-btn" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span className="page-info">Page {currentPage} of {totalPages}</span>
                  <button 
                    className="page-btn" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Notification Toast */}
      {showNotification && (
        <div className="notification-toast show">
          <div className="notification-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="notification-content">
            <div className="notification-title">{notificationData.title}</div>
            <div className="notification-message">{notificationData.message}</div>
          </div>
          <div className="notification-close" onClick={() => setShowNotification(false)}>
            <i className="fas fa-times"></i>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseMentor;
