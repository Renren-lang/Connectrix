import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, limit, orderBy, doc, updateDoc, addDoc, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore';
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
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState({});
  const [comments, setComments] = useState({});

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
        console.log('Forum posts data:', forumPosts);
        
        // Fetch comments for each post
        forumPosts.forEach(post => {
          fetchCommentsForPost(post.id);
        });
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

  // Load comments for existing posts when component mounts or posts change
  useEffect(() => {
    if (feedPosts.length > 0) {
      feedPosts.forEach(post => {
        // Only fetch if we don't already have comments for this post
        if (!comments[post.id]) {
          fetchCommentsForPost(post.id);
        }
      });
    }
  }, [feedPosts, currentUser]);

  // Fetch comments for a specific post
  const fetchCommentsForPost = async (postId) => {
    try {
      const commentsRef = collection(db, 'post-comments');
      
      // Try the indexed query first
      try {
        const q = query(
          commentsRef,
          where('postId', '==', postId),
          orderBy('createdAt', 'asc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt || 0)
          }));
          
          setComments(prev => ({
            ...prev,
            [postId]: commentsData
          }));
          
          // Auto-expand comments section if there are comments
          if (commentsData.length > 0) {
            setExpandedComments(prev => ({
              ...prev,
              [postId]: true
            }));
          }
        });
        
        return unsubscribe;
      } catch (indexError) {
        // If index is not ready, use a fallback query without orderBy
        console.warn('Index not ready, using fallback query:', indexError.message);
        
        const fallbackQuery = query(
          commentsRef,
          where('postId', '==', postId)
        );
        
        const unsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt || 0)
          })).sort((a, b) => a.createdAt - b.createdAt); // Sort in JavaScript
          
          setComments(prev => ({
            ...prev,
            [postId]: commentsData
          }));
          
          // Auto-expand comments section if there are comments
          if (commentsData.length > 0) {
            setExpandedComments(prev => ({
              ...prev,
              [postId]: true
            }));
          }
        });
        
        return unsubscribe;
      }
    } catch (error) {
      console.error('Error fetching comments for post:', postId, error);
    }
  };

  // Fetch mentorship requests from Firestore
  useEffect(() => {
    const fetchMentorshipRequests = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoadingRequests(true);
        
        // Fetch mentorship requests where current user is the mentor
        const requestsRef = collection(db, 'mentorship-requests');
        const q = query(
          requestsRef,
          where('mentorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMentorshipRequests(requests);
        console.log('Fetched mentorship requests:', requests.length);
      } catch (error) {
        console.error('Error fetching mentorship requests:', error);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    fetchMentorshipRequests();
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
      // Toggle comment section instead of navigating
      setExpandedComments(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    } else if (actionType === 'share') {
      alert('Share functionality would be implemented here');
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (postId, commentText, parentCommentId = null) => {
    if (!commentText.trim() || !currentUser) return;

    try {
      // Get user's actual name from their profile
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      const authorName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'Alumni';

      const commentData = {
        postId,
        content: commentText.trim(),
        authorId: currentUser.uid,
        authorName: authorName,
        authorRole: 'alumni',
        parentCommentId: parentCommentId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const commentsRef = collection(db, 'post-comments');
      await addDoc(commentsRef, commentData);

      // Clear comment input
      setCommentInputs(prev => ({
        ...prev,
        [postId]: ''
      }));

      // Clear reply state
      setReplyingTo(prev => ({
        ...prev,
        [postId]: null
      }));

      // Create notification for post author
      const post = feedPosts.find(p => p.id === postId);
      if (post && post.authorId && post.authorId !== currentUser.uid) {
        await createCommentNotification(post.authorId, postId, currentUser);
      }

      console.log('Comment submitted successfully');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    }
  };

  // Create notification for comment
  const createCommentNotification = async (recipientId, postId, commenter) => {
    try {
      // Get commenter's actual name
      const userRef = doc(db, 'users', commenter.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      const commenterName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.displayName || commenter.displayName || commenter.email?.split('@')[0] || 'Alumni';

      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        recipientId,
        type: 'comment',
        title: 'New Comment',
        message: `${commenterName} commented on your post`,
        postId,
        commenterId: commenter.uid,
        commenterName: commenterName,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating comment notification:', error);
    }
  };

  // Handle reply to comment
  const handleReplyToComment = (postId, commentId, commenterName) => {
    setReplyingTo(prev => ({
      ...prev,
      [postId]: commentId
    }));
    setCommentInputs(prev => ({
      ...prev,
      [postId]: `@${commenterName} `
    }));
  };

  // Handle comment input change
  const handleCommentInputChange = (postId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [postId]: value
    }));
  };

  const handleMentorshipRequest = async (requestId, action) => {
    try {
      const request = mentorshipRequests.find(r => r.id === requestId);
      if (!request) {
        console.error('Request not found');
        return;
      }

      // Update the request in Firestore
      const requestRef = doc(db, 'mentorship-requests', requestId);
      await updateDoc(requestRef, {
        status: action === 'accept' ? 'accepted' : 'declined',
        updatedAt: serverTimestamp()
      });

      // Create notification for the student
      const notification = {
        recipientId: request.studentId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Alumni',
        type: 'mentorship-response',
        title: action === 'accept' ? 'Mentorship Request Accepted!' : 'Mentorship Request Declined',
        message: action === 'accept' 
          ? `${currentUser.displayName || 'An alumni'} has accepted your mentorship request. You can now start messaging them!`
          : `${currentUser.displayName || 'An alumni'} has declined your mentorship request.`,
        data: {
          requestId: requestId,
          mentorId: currentUser.uid,
          mentorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Alumni',
          action: action === 'accept' ? 'accepted' : 'declined'
        },
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add notification to Firestore
      await addDoc(collection(db, 'notifications'), notification);
      console.log('Notification created for student:', request.studentId);

      // Update local state
      setMentorshipRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId
            ? { ...req, status: action === 'accept' ? 'accepted' : 'declined' }
            : req
        )
      );

      const actionText = action === 'accept' ? 'accepted' : 'declined';
      alert(`Mentorship request from ${request.name} ${actionText}! The student has been notified.`);
    } catch (error) {
      console.error('Error updating mentorship request:', error);
      alert('Failed to update mentorship request. Please try again.');
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
        <div className="dashboard-container">
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" title="Forum Discussions">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                  </svg>
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
                        <span>Comment</span>
                      </div>
                      <div 
                        className="post-action"
                        onClick={() => handlePostAction(post.id, 'share')}
                      >
                        <i className="far fa-share"></i>
                        <span>Share</span>
                      </div>
                    </div>

                    {/* Comments Section - Show if expanded OR if there are comments */}
                    {(expandedComments[post.id] || (comments[post.id] && comments[post.id].length > 0)) && (
                      <div className="comments-section">
                        {/* Comments List */}
                        <div className="comments-list">
                          {comments[post.id]?.map(comment => (
                            <div key={comment.id} className="comment-item">
                              <div className="comment-avatar">
                                {comment.authorName ? comment.authorName.split(' ').map(n => n[0]).join('') : 'U'}
                              </div>
                              <div className="comment-content">
                                <div className="comment-header">
                                  <span className="comment-author">{comment.authorName}</span>
                                  <span className="comment-time">
                                    {comment.createdAt ? 
                                      new Date(comment.createdAt).toLocaleDateString() : 
                                      'Just now'
                                    }
                                  </span>
                                </div>
                                <div className="comment-text">{comment.content}</div>
                                <div className="comment-actions">
                                  <button 
                                    className="reply-btn"
                                    onClick={() => handleReplyToComment(post.id, comment.id, comment.authorName)}
                                  >
                                    Reply
                                  </button>
                                </div>
                                
                                {/* Reply to comment input */}
                                {replyingTo[post.id] === comment.id && (
                                  <div className="reply-input">
                                    <input
                                      type="text"
                                      placeholder={`Reply to ${comment.authorName}...`}
                                      value={commentInputs[post.id] || ''}
                                      onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          handleCommentSubmit(post.id, e.target.value, comment.id);
                                        }
                                      }}
                                    />
                                    <button 
                                      className="reply-submit-btn"
                                      onClick={() => handleCommentSubmit(post.id, commentInputs[post.id], comment.id)}
                                    >
                                      Reply
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Comment Input */}
                        <div className="comment-input-section">
                          <div className="comment-input-avatar">
                            {currentUser ? 
                              (currentUser.firstName ? currentUser.firstName[0] : currentUser.email[0]) : 
                              'U'
                            }
                          </div>
                          <div className="comment-input-wrapper">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleCommentSubmit(post.id, e.target.value);
                                }
                              }}
                            />
                            <button 
                              className="comment-submit-btn"
                              onClick={() => handleCommentSubmit(post.id, commentInputs[post.id])}
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
                {isLoadingRequests ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading mentorship requests...</p>
                  </div>
                ) : mentorshipRequests.length > 0 ? (
                  mentorshipRequests.map(request => (
                    <div key={request.id} className="request-item" style={{ opacity: request.status === 'declined' ? 0.5 : 1 }}>
                      <div className="request-avatar">{request.studentName ? request.studentName.split(' ').map(n => n[0]).join('') : 'S'}</div>
                      <div className="request-info">
                        <div className="request-name">{request.studentName || 'Student'}</div>
                        <div className="request-details">{request.message || 'Mentorship request'}</div>
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
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-user-friends"></i>
                    </div>
                    <h3 className="empty-title">No Mentorship Requests</h3>
                    <p className="empty-message">You don't have any mentorship requests at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default AlumniDashboard;
