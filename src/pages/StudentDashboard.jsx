import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function StudentDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [suggestedMentors, setSuggestedMentors] = useState([]);
  const [isLoadingMentors, setIsLoadingMentors] = useState(true);
  const [mentorsError, setMentorsError] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('StudentDashboard mounted');
    console.log('Navigate function available:', typeof navigate);
  }, [navigate]);

  // Fetch suggested mentors from database
  useEffect(() => {
    const fetchSuggestedMentors = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoadingMentors(true);
        setMentorsError(null);
        
        console.log('Fetching suggested mentors...');
        console.log('Current user:', currentUser);
        console.log('Firebase db object:', db);
        
        // Check if Firebase is properly initialized
        if (!db) {
          throw new Error('Firebase database not initialized');
        }
        
        // Try to fetch mentors with different approaches
        let mentorsData = [];
        
        try {
          // Approach 1: Try with query
          console.log('Trying approach 1: Query with filters');
          const mentorsRef = collection(db, 'users');
          console.log('Collection reference:', mentorsRef);
          
          const q = query(
            mentorsRef,
            where('role', '==', 'alumni'),
            limit(3)
          );
          console.log('Query created successfully:', q);
          
          const querySnapshot = await getDocs(q);
          console.log('Query result:', querySnapshot.docs.length, 'documents');
          
          mentorsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              avatar: (data.firstName?.charAt(0) || '') + (data.lastName?.charAt(0) || '') || 'U',
              name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.displayName || 'Alumni User',
              meta: `${data.course || 'General'} • Batch ${data.batch || 'N/A'}`,
              bio: data.experience || 'Experienced alumni available for mentoring.',
              tags: data.skills ? data.skills.split(',').map(skill => skill.trim()).slice(0, 3) : ['General Skills'],
      isConnected: false
            };
          });
          
        } catch (queryError) {
          console.warn('Query approach failed, trying fallback:', queryError);
          
          // Approach 2: Fallback - get all users and filter in JavaScript
          try {
            console.log('Trying approach 2: Get all users and filter');
            const mentorsRef = collection(db, 'users');
            const snapshot = await getDocs(mentorsRef);
            
            const allUsers = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Filter for alumni in JavaScript
            const alumniUsers = allUsers.filter(user => user.role === 'alumni').slice(0, 3);
            
            mentorsData = alumniUsers.map(user => ({
              id: user.id,
              avatar: (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '') || 'U',
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName || 'Alumni User',
              meta: `${user.course || 'General'} • Batch ${user.batch || 'N/A'}`,
              bio: user.experience || 'Experienced alumni available for mentoring.',
              tags: user.skills ? user.skills.split(',').map(skill => skill.trim()).slice(0, 3) : ['General Skills'],
      isConnected: false
            }));
            
            console.log('Fallback approach successful, found', mentorsData.length, 'mentors');
            
          } catch (fallbackError) {
            console.error('Fallback approach also failed:', fallbackError);
            throw new Error(`Both query approaches failed: ${fallbackError.message}`);
          }
        }
        
        console.log('Final mentors data:', mentorsData);
        setSuggestedMentors(mentorsData);
        
      } catch (error) {
        console.error('Error fetching suggested mentors:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        setMentorsError(`Failed to load suggested mentors: ${error.message}`);
      } finally {
        setIsLoadingMentors(false);
      }
    };

    fetchSuggestedMentors();
  }, [currentUser]);

  // Fetch alumni posts from database
  useEffect(() => {
    const fetchAlumniPosts = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoadingPosts(true);
        
        // For now, we'll create sample posts from real alumni data
        // In a real app, you'd have a separate 'posts' collection
        const alumniRef = collection(db, 'users');
        const q = query(
          alumniRef,
          where('role', '==', 'alumni'),
          limit(3)
        );
        
        const querySnapshot = await getDocs(q);
        const alumniData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const firstName = data.firstName || '';
          const lastName = data.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          // Better fallback logic for display name
          let displayName = fullName;
          if (!displayName && data.displayName) {
            displayName = data.displayName;
          }
          if (!displayName && data.email) {
            displayName = data.email.split('@')[0];
          }
          if (!displayName) {
            displayName = 'Alumni User';
          }
          
          return {
            id: doc.id,
            avatar: displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            name: displayName,
            meta: `${data.course || 'General'} '${data.batch || ''} • ${Math.floor(Math.random() * 24)} hours ago`,
            content: data.experience ? 
              `Hello students! I'm ${displayName}, a ${data.course || 'alumni'} graduate from batch ${data.batch || 'N/A'}. ${data.experience}. Feel free to reach out if you have any questions about your career path!` :
              `Hi everyone! I'm ${displayName}, a ${data.course || 'alumni'} graduate. I'm here to help students with career guidance and mentorship. Don't hesitate to reach out!`,
            type: ['job', 'tip', 'event'][Math.floor(Math.random() * 3)],
            likes: Math.floor(Math.random() * 50),
            comments: Math.floor(Math.random() * 20),
            isLiked: false
          };
        });
        
        setFeedPosts(alumniData);
        console.log('Fetched alumni posts:', alumniData.length);
      } catch (error) {
        console.error('Error fetching alumni posts:', error);
        // Fallback to empty array if there's an error
        setFeedPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchAlumniPosts();
  }, [currentUser]);

  const handleQuickAccessClick = (cardTitle) => {
    alert(`Navigating to ${cardTitle} section`);
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    console.log(`Filtering feed by: ${filterType}`);
  };

  const handlePostAction = (postId, actionType) => {
    if (actionType === 'like') {
      // In a real app, this would update the database
      console.log(`Liked post ${postId}`);
    } else {
      alert(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} functionality would be implemented here`);
    }
  };

  const handleMentorConnect = async (mentorId) => {
    if (!currentUser) {
      alert('Please log in to send a mentorship request.');
      return;
    }

    try {
      // Find the mentor data
      const mentor = suggestedMentors.find(m => m.id === mentorId);
      if (!mentor) {
        alert('Mentor not found');
        return;
      }

      console.log('Creating mentorship request for mentor:', mentorId);
      
      // Create mentorship request
      const mentorshipRequest = {
        studentId: currentUser.uid,
        studentName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
        studentEmail: currentUser.email,
        mentorId: mentorId,
        mentorName: mentor.name,
        status: 'pending', // pending, accepted, rejected
        message: `Hi ${mentor.name}, I would like to request your mentorship. I'm interested in learning from your experience in ${mentor.tags.join(', ')}.`,
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

      // Update the mentor's isConnected status locally
      setSuggestedMentors(prev => prev.map(m => 
        m.id === mentorId ? { ...m, isConnected: true } : m
      ));

      alert(`Mentorship request sent to ${mentor.name}! They will be notified and can respond to your request.`);
      
    } catch (error) {
      console.error('Error creating mentorship request:', error);
      alert('Failed to send mentorship request. Please try again.');
    }
  };

  const handleViewMentorProfile = (mentorName) => {
    alert(`Viewing profile of ${mentorName}`);
  };

  const handleNotificationClick = () => {
    alert('Notifications panel would open here');
  };

  const handleUserProfileClick = () => {
    alert('User profile menu would open here');
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'job':
        return 'badge-job';
      case 'tip':
        return 'badge-tip';
      case 'event':
        return 'badge-event';
      default:
        return '';
    }
  };

  const getBadgeText = (type) => {
    switch (type) {
      case 'job':
        return 'Job';
      case 'tip':
        return 'Tip';
      case 'event':
        return 'Event';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Main Dashboard Content */}
      <main className="dashboard">
        <div className="container">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1 className="welcome-title">
              Welcome back, {currentUser?.firstName && currentUser?.lastName 
                             ? `${currentUser.firstName} ${currentUser.lastName}`
                             : currentUser?.displayName || 
                             (currentUser?.email ? currentUser.email.split('@')[0] : 'User')}!
            </h1>
            <p className="welcome-subtitle">Here's what's happening with your mentorship network today.</p>
            
            {/* Test Navigation Button - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <button 
                onClick={() => {
                  console.log('Test button clicked!');
                  navigate('/browse-mentor');
                }}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Test Navigation to Browse Mentors
              </button>
            )}
          </div>

          {/* Quick Access Cards */}
          <section className="quick-access">
            <h2 className="section-title">Quick Access</h2>
            <div className="quick-access-grid">
              <div className="quick-access-card" onClick={() => {
                console.log('Find Mentors clicked!');
                navigate('/browse-mentor');
              }}>
                 <div className="card-icon mentors">
                   <i className="fas fa-user-tie"></i>
                 </div>
                 <h3 className="card-title">Find Mentors</h3>
                 <p className="card-description">Connect with alumni who can guide your career path</p>
               </div>
              <div className="quick-access-card" onClick={() => {
                console.log('Forum clicked!');
                console.log('Navigating to /forum');
                navigate('/forum');
              }}>
                 <div className="card-icon forum">
                   <i className="fas fa-comments"></i>
                 </div>
                 <h3 className="card-title">Forum Discussions</h3>
                 <p className="card-description">Join discussions and connect with the community</p>
               </div>
              <div className="quick-access-card" onClick={() => {
                console.log('Messages clicked!');
                navigate('/messaging');
              }}>
                 <div className="card-icon messages">
                   <i className="fas fa-comments"></i>
                 </div>
                 <h3 className="card-title">Messages</h3>
                 <p className="card-description">Check your conversations with mentors and peers</p>
               </div>
              <div className="quick-access-card" onClick={() => {
                console.log('Events clicked!');
                navigate('/events');
              }}>
                 <div className="card-icon events">
                   <i className="fas fa-calendar-alt"></i>
                 </div>
                 <h3 className="card-title">Events & Opportunities</h3>
                 <p className="card-description">Find networking events and career opportunities</p>
               </div>
            </div>
          </section>

          {/* Activity Feed */}
          <section className="activity-feed">
            <h2 className="section-title">Activity Feed</h2>
            <div className="feed-container">
              <div className="feed-header">
                <h3>Recent Alumni Posts</h3>
                <div className="feed-filters">
                  {['All', 'Jobs', 'Tips', 'Events'].map(filter => (
                    <button
                      key={filter}
                      className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                      onClick={() => handleFilterChange(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="feed-posts">
                {isLoadingPosts ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading alumni posts...</p>
                  </div>
                ) : feedPosts.length > 0 ? (
                  feedPosts.map(post => (
                  <div key={post.id} className="feed-post">
                    <div className="post-header">
                      <div className="post-avatar">{post.avatar}</div>
                      <div className="post-user">
                        <div className="post-name">{post.name}</div>
                        <div className="post-meta">{post.meta}</div>
                      </div>
                      <div className={`post-badge ${getBadgeClass(post.type)}`}>
                        {getBadgeText(post.type)}
                      </div>
                    </div>
                    <div className="post-content">
                      {post.content}
                    </div>
                    <div className="post-actions">
                      <div 
                        className="post-action"
                        onClick={() => handlePostAction(post.id, 'like')}
                      >
                        <i className={post.isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
                        <span>{post.likes}</span>
                      </div>
                      <div 
                        className="post-action"
                        onClick={() => handlePostAction(post.id, 'comment')}
                      >
                        <i className="far fa-comment"></i>
                        <span>{post.comments}</span>
                      </div>
                      <div 
                        className="post-action"
                        onClick={() => handlePostAction(post.id, 'share')}
                      >
                        <i className="far fa-share"></i>
                        <span>Share</span>
                      </div>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-newspaper"></i>
                    </div>
                    <h3 className="empty-title">No alumni posts yet</h3>
                    <p className="empty-message">Check back later for updates from alumni mentors.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Suggested Mentors */}
          <section className="suggested-mentors">
            <h2 className="section-title">Suggested Mentors</h2>
            <div className="mentors-container">
              {isLoadingMentors ? (
                <p>Loading suggested mentors...</p>
              ) : mentorsError ? (
                <p style={{ color: 'red' }}>{mentorsError}</p>
              ) : suggestedMentors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                  <p>No mentors available at the moment.</p>
                  <p>Check back later or browse all mentors in the Browse Mentors section.</p>
                </div>
              ) : (
                suggestedMentors.map(mentor => (
                <div key={mentor.id} className="mentor-card">
                  <div className="mentor-header">
                    <div className="mentor-avatar">{mentor.avatar}</div>
                    <div className="mentor-info">
                      <h3>{mentor.name}</h3>
                      <p>{mentor.meta}</p>
                    </div>
                  </div>
                  <div className="mentor-bio">
                    {mentor.bio}
                  </div>
                  <div className="mentor-tags">
                    {mentor.tags.map((tag, index) => (
                      <span key={index} className="mentor-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="mentor-actions">
                    <button 
                        className={`btn ${mentor.isConnected ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleMentorConnect(mentor.id)}
                        disabled={mentor.isConnected}
                    >
                        {mentor.isConnected ? 'Request Sent' : 'Request Mentorship'}
                    </button>
                    <button 
                      className="btn btn-outline"
                      onClick={() => handleViewMentorProfile(mentor.name)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default StudentDashboard;
