import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

function AlumniDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [mentorshipRequests, setMentorshipRequests] = useState([
    {
      id: 1,
      name: 'Alex Smith',
      details: 'Computer Science \'24 • Interested in Software Engineering',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Rachel Green',
      details: 'Marketing \'23 • Interested in Digital Marketing',
      status: 'pending'
    },
    {
      id: 3,
      name: 'David Lee',
      details: 'Business Administration \'24 • Interested in Finance',
      status: 'pending'
    }
  ]);

  const [feedPosts, setFeedPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Fetch forum posts from students for alumni dashboard
  useEffect(() => {
    const fetchStudentForumPosts = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoadingPosts(true);
        
        // Fetch real forum posts from students
        const forumRef = collection(db, 'forum-posts');
        const q = query(
          forumRef,
          where('authorRole', '==', 'student'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        
        const querySnapshot = await getDocs(q);
        const forumPosts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const timeAgo = data.createdAt ? 
            Math.floor((new Date() - data.createdAt.toDate()) / (1000 * 60 * 60)) : 
            Math.floor(Math.random() * 24);
          
          return {
            id: doc.id,
            avatar: data.authorName ? data.authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'S',
            name: data.authorName || 'Student',
            meta: `${data.category || 'General'} • ${timeAgo} hours ago`,
            content: data.content || 'No content available',
            badge: data.category === 'career' ? 'Career Advice' : 
                   data.category === 'technical' ? 'Technical' : 
                   data.category === 'general' ? 'General' : 'Forum Post',
            badgeType: data.category === 'career' ? 'inquiry' : 
                      data.category === 'technical' ? 'update' : 'job',
            likes: data.likes || 0,
            comments: data.replyCount || 0,
            isLiked: false,
            forumPostId: doc.id,
            category: data.category
          };
        });
        
        setFeedPosts(forumPosts);
        console.log('Fetched student forum posts:', forumPosts.length);
      } catch (error) {
        console.error('Error fetching student forum posts:', error);
        // Fallback to empty array if there's an error
        setFeedPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchStudentForumPosts();
  }, [currentUser]);

  const handleQuickAccessClick = (cardTitle) => {
    switch (cardTitle) {
      case 'Mentor Students':
        navigate('/mentorship');
        break;
      case 'View Student Profiles':
        navigate('/student-profiles');
        break;
      case 'Messages':
        navigate('/messaging');
        break;
      case 'Post an Event/Opportunity':
        navigate('/events');
        break;
      default:
        alert(`Navigating to ${cardTitle} section`);
    }
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    console.log(`Filtering feed by: ${filterType}`);
  };

  const handlePostAction = (postId, actionType) => {
    if (actionType === 'like') {
      setFeedPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1
              }
            : post
        )
      );
    } else if (actionType === 'comment') {
      const post = feedPosts.find(p => p.id === postId);
      if (post && post.forumPostId) {
        // Navigate to Forum with the specific post
        navigate('/forum', { 
          state: { 
            scrollToPost: post.forumPostId,
            category: post.category 
          } 
        });
      } else {
        alert(`Replying to: ${post.content.substring(0, 50)}...`);
      }
    } else if (actionType === 'share') {
      alert('Share functionality would be implemented here');
    }
  };

  const handleMentorshipRequest = (requestId, action) => {
    if (action === 'accept') {
      setMentorshipRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: 'accepted' }
            : request
        )
      );
      
      const request = mentorshipRequests.find(r => r.id === requestId);
      alert(`Mentorship request from ${request.name} accepted!`);
    } else if (action === 'decline') {
      const request = mentorshipRequests.find(r => r.id === requestId);
      if (confirm(`Are you sure you want to decline the mentorship request from ${request.name}?`)) {
        setMentorshipRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === requestId
              ? { ...req, status: 'declined' }
              : req
          )
        );
      }
    }
  };



  const handleViewAllClick = (e) => {
    e.preventDefault();
    alert('View all mentorship requests page would open here');
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
            <p className="welcome-subtitle">Here's what's happening with your mentorship activities today.</p>
            

          </div>

          {/* Quick Access Cards */}
          <section className="quick-access">
            <h2 className="section-title">Quick Access</h2>
            <div className="quick-access-grid">
              <div className="quick-access-card" onClick={() => handleQuickAccessClick('Mentor Students')}>
                <div className="card-icon mentor">
                  <i className="fas fa-chalkboard-teacher"></i>
                </div>
                <h3 className="card-title">Mentor Students</h3>
                <p className="card-description">Connect with students seeking guidance in your field</p>
              </div>
              <div className="quick-access-card" onClick={() => {
                console.log('Forum clicked!');
                console.log('Navigating to /forum');
                navigate('/forum');
              }}>
                <div className="card-icon forum">
                  <i className="fas fa-comments-alt"></i>
                </div>
                <h3 className="card-title">Forum Discussions</h3>
                <p className="card-description">Join discussions and connect with the community</p>
              </div>
              <div className="quick-access-card" onClick={() => handleQuickAccessClick('Messages')}>
                <div className="card-icon messages">
                  <i className="fas fa-comments"></i>
                </div>
                <h3 className="card-title">Messages</h3>
                <p className="card-description">Check your conversations with students and alumni</p>
              </div>
              <div className="quick-access-card" onClick={() => handleQuickAccessClick('Post an Event/Opportunity')}>
                <div className="card-icon post">
                  <i className="fas fa-plus-circle"></i>
                </div>
                <h3 className="card-title">Post an Event/Opportunity</h3>
                <p className="card-description">Share events, job openings, or opportunities</p>
              </div>
            </div>
          </section>

          {/* Activity Feed */}
          <section className="activity-feed">
            <h2 className="section-title">Activity Feed</h2>
            <div className="feed-container">
              <div className="feed-header">
                <h3>Recent Student Activities</h3>
                <div className="feed-filters">
                  {['All', 'Inquiries', 'Updates', 'Job Requests'].map(filter => (
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
                    <p>Loading student activities...</p>
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
                      <div className={`post-badge badge-${post.badgeType}`}>
                        {post.badge}
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
                        <i className={post.isLiked ? 'fas fa-heart' : 'far fa-heart'} 
                           style={{ color: post.isLiked ? 'var(--danger-color)' : '' }}></i>
                        <span>{post.likes}</span>
                      </div>
                      <div 
                        className="post-action"
                        onClick={() => handlePostAction(post.id, 'comment')}
                      >
                        <i className="far fa-comment"></i>
                        <span>{post.comments > 0 ? post.comments : 'Reply'}</span>
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
                      <i className="fas fa-users"></i>
                    </div>
                    <h3 className="empty-title">No student activities yet</h3>
                    <p className="empty-message">Check back later for updates from students.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Mentorship Requests */}
          <section className="mentorship-requests">
            <h2 className="section-title">Mentorship Requests</h2>
            <div className="requests-container">
              <div className="requests-header">
                <h3>Pending Requests</h3>
                <a href="#" className="view-all" onClick={handleViewAllClick}>View All</a>
              </div>
              <div className="requests-list">
                {mentorshipRequests.map(request => (
                  <div key={request.id} className="request-item" style={{ opacity: request.status === 'declined' ? 0.5 : 1 }}>
                    <div className="request-avatar">{request.name.split(' ').map(n => n[0]).join('')}</div>
                    <div className="request-info">
                      <div className="request-name">{request.name}</div>
                      <div className="request-details">{request.details}</div>
                    </div>
                    <div className="request-actions">
                      {request.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMentorshipRequest(request.id, 'accept')}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => handleMentorshipRequest(request.id, 'decline')}
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {request.status === 'accepted' && (
                        <button className="btn btn-primary btn-sm" disabled style={{ backgroundColor: 'var(--success-color)' }}>
                          Accepted
                        </button>
                      )}
                      {request.status === 'declined' && (
                        <button className="btn btn-outline btn-sm" disabled>
                          Declined
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default AlumniDashboard;
