import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, orderBy, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState({});
  const [postComments, setPostComments] = useState({});
  const [showReplyInput, setShowReplyInput] = useState({});
  const [postReactions, setPostReactions] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState({});
  const [reactionPickerPosition, setReactionPickerPosition] = useState({});

  // Facebook-like reaction types
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Like', color: '#1877f2' },
    { type: 'love', emoji: '❤️', label: 'Love', color: '#e74c3c' },
    { type: 'laugh', emoji: '😂', label: 'Haha', color: '#f39c12' },
    { type: 'wow', emoji: '😮', label: 'Wow', color: '#f1c40f' },
    { type: 'sad', emoji: '😢', label: 'Sad', color: '#9b59b6' },
    { type: 'angry', emoji: '😡', label: 'Angry', color: '#e67e22' }
  ];

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
        
        // Fetch real forum posts from alumni
        const forumRef = collection(db, 'forum-posts');
        const q = query(
          forumRef,
          where('authorRole', '==', 'alumni'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const forumPosts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const timeAgo = data.createdAt ? 
            Math.floor((new Date() - data.createdAt.toDate()) / (1000 * 60 * 60)) : 
            Math.floor(Math.random() * 24);
          
          return {
            id: doc.id,
            avatar: data.authorName ? data.authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A',
            name: data.authorName || 'Alumni',
            meta: `${data.category || 'General'} • ${timeAgo} hours ago`,
            content: data.content || 'No content available',
            type: data.category === 'career' ? 'tip' : 
                  data.category === 'technical' ? 'tip' : 
                  data.category === 'general' ? 'job' : 'event',
            likes: data.likes || 0,
            comments: data.replyCount || 0,
            isLiked: false,
            forumPostId: doc.id,
            category: data.category,
            authorId: data.authorId // Add authorId to the post data
          };
        });
        
        setFeedPosts(forumPosts);
        console.log('Fetched alumni forum posts:', forumPosts.length);
        console.log('Alumni posts data:', forumPosts);
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

  // Load reactions for existing posts when component mounts or posts change
  useEffect(() => {
    if (feedPosts.length > 0) {
      feedPosts.forEach(post => {
        // Load reactions for each post
        fetchPostReactions(post.id);
      });
    }
  }, [feedPosts, currentUser]);

  // Fetch reactions for a specific post
  const fetchPostReactions = async (postId) => {
    try {
      const reactionsRef = collection(db, 'forum-posts', postId, 'reactions');
      const q = query(reactionsRef);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Count reactions by type
        const reactionCounts = {};
        reactionsData.forEach(reaction => {
          reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
        });
        
        // Check if current user has reacted
        const userReaction = reactionsData.find(r => r.userId === currentUser?.uid);
        
        setPostReactions(prev => ({
          ...prev,
          [postId]: {
            counts: reactionCounts,
            userReaction: userReaction?.type || null,
            total: reactionsData.length
          }
        }));
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching reactions for post:', postId, error);
    }
  };

  const handleQuickAccessClick = (cardTitle) => {
    alert(`Navigating to ${cardTitle} section`);
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    console.log(`Filtering feed by: ${filterType}`);
  };

  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) {
      alert('Please log in to react to posts');
      return;
    }

    try {
      const post = feedPosts.find(p => p.id === postId);
      if (!post) {
        console.error('Post not found:', postId);
        return;
      }

      console.log('Handling reaction:', { postId, reactionType, userId: currentUser.uid });

      const reactionsRef = collection(db, 'forum-posts', postId, 'reactions');
      const userReactionQuery = query(reactionsRef, where('userId', '==', currentUser.uid));
      const userReactionSnapshot = await getDocs(userReactionQuery);

      if (userReactionSnapshot.empty) {
        // Add new reaction
        console.log('Adding new reaction');
        await addDoc(reactionsRef, {
          userId: currentUser.uid,
          type: reactionType,
          createdAt: serverTimestamp()
        });
        
        // Create notification for post author
        await createReactionNotification(post.authorId, postId, reactionType, post.content);
      } else {
        // Update existing reaction
        const existingReaction = userReactionSnapshot.docs[0];
        const existingType = existingReaction.data().type;
        
        if (existingType === reactionType) {
          // Remove reaction if same type
          console.log('Removing existing reaction');
          await deleteDoc(existingReaction.ref);
        } else {
          // Update to new reaction type
          console.log('Updating reaction type from', existingType, 'to', reactionType);
          await updateDoc(existingReaction.ref, {
            type: reactionType,
            updatedAt: serverTimestamp()
          });
          
          // Create notification for post author
          await createReactionNotification(post.authorId, postId, reactionType, post.content);
        }
      }

      console.log('Reaction handled successfully');
      alert(`Reacted with ${reactionTypes.find(r => r.type === reactionType)?.emoji} ${reactionTypes.find(r => r.type === reactionType)?.label}!`);
      
    } catch (error) {
      console.error('Error handling reaction:', error);
      alert('Failed to react to post. Please try again.');
    }
  };

  const createReactionNotification = async (authorId, postId, reactionType, postContent) => {
    if (authorId === currentUser.uid) return; // Don't notify self

    try {
      const reactionEmoji = reactionTypes.find(r => r.type === reactionType)?.emoji || '👍';
      const reactionLabel = reactionTypes.find(r => r.type === reactionType)?.label || 'Like';
      
      const notification = {
        recipientId: authorId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        type: 'forum-reaction',
        title: `${reactionEmoji} New Reaction`,
        message: `${currentUser.displayName || 'Someone'} reacted with ${reactionLabel} to your post "${postContent.substring(0, 50)}..."`,
        data: {
          postId: postId,
          reactionType: reactionType,
          postContent: postContent
        },
        read: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notification);
      console.log('Notification created successfully');
    } catch (error) {
      console.error('Error creating reaction notification:', error);
    }
  };

  const fetchPostComments = async (postId) => {
    try {
      const commentsRef = collection(db, 'forum-comments');
      const q = query(commentsRef, where('postId', '==', postId), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const comments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPostComments(prev => ({
        ...prev,
        [postId]: comments
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Handle long press for reaction picker
  const handleReactionLongPress = (postId, event) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setReactionPickerPosition({
      [postId]: {
        x: rect.left + rect.width / 2,
        y: rect.top - 60
      }
    });
    setShowReactionPicker(prev => ({
      ...prev,
      [postId]: true
    }));
  };

  // Handle reaction picker selection
  const handleReactionSelect = (postId, reactionType) => {
    handleReaction(postId, reactionType);
    setShowReactionPicker(prev => ({
      ...prev,
      [postId]: false
    }));
  };

  // Hide reaction picker
  const hideReactionPicker = (postId) => {
    setShowReactionPicker(prev => ({
      ...prev,
      [postId]: false
    }));
  };

  const handlePostAction = (postId, actionType) => {
    if (actionType === 'like') {
      handleReaction(postId, 'like');
    } else if (actionType === 'comment') {
      // Toggle comment input for this post
      setShowCommentInput(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
      
      // Fetch comments if not already loaded
      if (!postComments[postId]) {
        fetchPostComments(postId);
      }
    } else if (actionType === 'share') {
      const post = feedPosts.find(p => p.id === postId);
      if (post) {
        handleSharePost(postId, post);
      }
    }
  };

  const handleSharePost = async (postId, post) => {
    if (!currentUser) {
      alert('Please log in to share posts');
      return;
    }

    try {
      // Create a shared post
      const sharedPost = {
        originalPostId: postId,
        originalAuthorId: post.authorId,
        originalTitle: post.content.substring(0, 100),
        originalContent: post.content,
        sharedBy: currentUser.uid,
        sharedByName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        category: post.category || 'general',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-posts'), sharedPost);

      // Create notification for original author
      const notification = {
        recipientId: post.authorId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        type: 'forum-share',
        title: '📤 Post Shared',
        message: `${currentUser.displayName || 'Someone'} shared your post "${post.content.substring(0, 50)}..."`,
        data: {
          originalPostId: postId,
          postContent: post.content
        },
        read: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notification);

      alert('Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post. Please try again.');
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    
    const commentInput = e.target.querySelector('textarea');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
      alert('Please enter a comment');
      return;
    }

    const post = feedPosts.find(p => p.id === postId);
    if (!post) {
      alert('Post not found');
      return;
    }

    try {
      console.log('Posting comment for post:', postId);
      console.log('Post authorId:', post.authorId);
      
      // Get user's actual name from their profile
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      const authorName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
      
      // Create a comment
      const comment = {
        postId: postId,
        authorId: currentUser.uid,
        authorName: authorName,
        content: commentText,
        parentCommentId: null, // Top-level comment
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-comments'), comment);

      // Create notification for post author (only if authorId exists and is not the current user)
      if (post.authorId && post.authorId !== currentUser.uid) {
        console.log('Creating notification for author:', post.authorId);
        
        const notification = {
          recipientId: post.authorId,
          senderId: currentUser.uid,
          senderName: authorName,
          type: 'forum-comment',
          title: '💬 New Comment',
          message: `${authorName} commented on your post "${post.content.substring(0, 50)}..."`,
          data: {
            postId: postId,
            postContent: post.content,
            commentContent: commentText
          },
          read: false,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'notifications'), notification);
        console.log('Notification created successfully');
      } else {
        console.log('Skipping notification - no authorId or self-comment');
      }

      // Clear the input
      commentInput.value = '';
      
      // Refresh comments for this post
      await fetchPostComments(postId);
      
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  const handleReplySubmit = async (e, postId, parentCommentId) => {
    e.preventDefault();
    
    const replyInput = e.target.querySelector('textarea');
    const replyText = replyInput.value.trim();
    
    if (!replyText) {
      alert('Please enter a reply');
      return;
    }

    const post = feedPosts.find(p => p.id === postId);
    if (!post) {
      alert('Post not found');
      return;
    }

    try {
      console.log('Posting reply for post:', postId, 'parent comment:', parentCommentId);
      
      // Get user's actual name from their profile
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      const authorName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
      
      // Create a reply
      const reply = {
        postId: postId,
        authorId: currentUser.uid,
        authorName: authorName,
        content: replyText,
        parentCommentId: parentCommentId, // This makes it a reply
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-comments'), reply);

      // Find the parent comment to get its author
      const parentComment = postComments[postId]?.find(c => c.id === parentCommentId);
      if (parentComment && parentComment.authorId !== currentUser.uid) {
        console.log('Creating notification for comment author:', parentComment.authorId);
        
        const notification = {
          recipientId: parentComment.authorId,
          senderId: currentUser.uid,
          senderName: authorName,
          type: 'comment-reply',
          title: '💬 Reply to Your Comment',
          message: `${authorName} replied to your comment`,
          data: {
            postId: postId,
            postContent: post.content,
            commentContent: replyText,
            originalCommentId: parentCommentId
          },
          read: false,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'notifications'), notification);
        console.log('Reply notification created successfully');
      }

      // Clear the input and hide reply form
      replyInput.value = '';
      setShowReplyInput(prev => ({
        ...prev,
        [parentCommentId]: false
      }));
      
      // Refresh comments for this post
      await fetchPostComments(postId);
      
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
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
        <div className="dashboard-container">
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
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" title="Forum Discussions">
                     <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                   </svg>
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
                      <div className="action-buttons">
                        <button 
                          className={`action-btn like-btn ${postReactions[post.id]?.userReaction ? 'reacted' : ''}`}
                          onClick={() => handleReaction(post.id, 'like')}
                          onMouseDown={(e) => handleReactionLongPress(post.id, e)}
                          onTouchStart={(e) => handleReactionLongPress(post.id, e)}
                          onMouseLeave={() => hideReactionPicker(post.id)}
                          onTouchEnd={() => hideReactionPicker(post.id)}
                        >
                          <i className={`fas fa-thumbs-up ${postReactions[post.id]?.userReaction === 'like' ? 'active' : ''}`}></i>
                          <span>
                            {postReactions[post.id]?.userReaction ? 
                              reactionTypes.find(r => r.type === postReactions[post.id].userReaction)?.emoji : 
                              'Like'
                            }
                          </span>
                          {postReactions[post.id]?.total > 0 && (
                            <span className="reaction-count">{postReactions[post.id].total}</span>
                          )}
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => handlePostAction(post.id, 'comment')}
                        >
                          <i className="far fa-comment"></i>
                          Comment
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => handlePostAction(post.id, 'share')}
                        >
                          <i className="far fa-share"></i>
                          Share
                        </button>
                      </div>
                    </div>

                    {/* Facebook-style Reaction Picker */}
                    {showReactionPicker[post.id] && (
                      <div 
                        className="reaction-picker"
                        style={{
                          position: 'fixed',
                          left: `${reactionPickerPosition[post.id]?.x - 120}px`,
                          top: `${reactionPickerPosition[post.id]?.y}px`,
                          zIndex: 1000
                        }}
                        onMouseLeave={() => hideReactionPicker(post.id)}
                      >
                        <div className="reaction-picker-content">
                          {reactionTypes.map((reaction, index) => (
                            <button
                              key={reaction.type}
                              className="reaction-option"
                              onClick={() => handleReactionSelect(post.id, reaction.type)}
                              style={{
                                animationDelay: `${index * 0.1}s`
                              }}
                            >
                              <span className="reaction-emoji">{reaction.emoji}</span>
                              <span className="reaction-label">{reaction.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Facebook-like Comments Section */}
                    <div className="comments-section">
                      {/* Show comments if they exist */}
                      {postComments[post.id] && postComments[post.id].length > 0 && (
                        <div className="comments-list">
                          {postComments[post.id]
                            .filter(comment => !comment.parentCommentId) // Only show top-level comments
                            .map(comment => (
                            <div key={comment.id} className="comment-item">
                              <div className="comment-avatar">
                                {comment.authorName ? comment.authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                              </div>
                              <div className="comment-content">
                                <div className="comment-header">
                                  <span className="comment-author">{comment.authorName || 'Anonymous'}</span>
                                  <span className="comment-time">
                                    {comment.createdAt ? new Date(comment.createdAt.toDate()).toLocaleString() : 'Unknown time'}
                                  </span>
                                </div>
                                <div className="comment-text">{comment.content}</div>
                                
                                {/* Reply button */}
                                <div className="comment-actions">
                                  <button 
                                    className="reply-btn"
                                    onClick={() => setShowReplyInput(prev => ({
                                      ...prev,
                                      [comment.id]: !prev[comment.id]
                                    }))}
                                  >
                                    Reply
                                  </button>
                                </div>
                                
                                {/* Nested Replies */}
                                {postComments[post.id]
                                  .filter(reply => reply.parentCommentId === comment.id)
                                  .map(reply => (
                                    <div key={reply.id} className="reply-item">
                                      <div className="reply-avatar">
                                        {reply.authorName ? reply.authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                      </div>
                                      <div className="reply-content">
                                        <div className="reply-header">
                                          <span className="reply-author">{reply.authorName || 'Anonymous'}</span>
                                          <span className="reply-time">
                                            {reply.createdAt ? new Date(reply.createdAt.toDate()).toLocaleString() : 'Unknown time'}
                                          </span>
                                        </div>
                                        <div className="reply-text">{reply.content}</div>
                                        
                                        {/* Reply to reply button */}
                                        <div className="reply-actions">
                                          <button 
                                            className="reply-btn"
                                            onClick={() => setShowReplyInput(prev => ({
                                              ...prev,
                                              [reply.id]: !prev[reply.id]
                                            }))}
                                          >
                                            Reply
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                
                                {/* Reply Input for this comment */}
                                {showReplyInput[comment.id] && (
                                  <div className="reply-input-section">
                                    <form onSubmit={(e) => handleReplySubmit(e, post.id, comment.id)}>
                                      <div className="reply-input-wrapper">
                                        <div className="reply-input-avatar">
                                          {currentUser.displayName ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                        </div>
                                        <textarea
                                          className="reply-input"
                                          placeholder="Write a reply..."
                                          rows="2"
                                          required
                                        />
                                        <button type="submit" className="reply-submit-btn">
                                          <i className="fas fa-paper-plane"></i>
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Show "No comments yet" if no comments */}
                      {postComments[post.id] && postComments[post.id].length === 0 && (
                        <div className="no-comments">
                          <p>No comments yet</p>
                        </div>
                      )}
                      
                      {/* Comment Input - Show when comment button is clicked */}
                      {showCommentInput[post.id] && (
                        <div className="comment-input-section">
                          <form onSubmit={(e) => handleCommentSubmit(e, post.id)}>
                            <div className="comment-input-wrapper">
                              <div className="comment-input-avatar">
                                {currentUser.displayName ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                              </div>
                              <textarea
                                className="comment-input"
                                placeholder="Write a comment..."
                                rows="2"
                                required
                              />
                              <button type="submit" className="comment-submit-btn">
                                <i className="fas fa-paper-plane"></i>
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-newspaper"></i>
                    </div>
                    <h3 className="empty-title">No Recent Alumni Posts</h3>
                    <p className="empty-message">No recent posts from alumni at the moment. Check the Forum section to see all discussions and posts.</p>
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

      {/* Comment Modal */}
      {showCommentModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add a Comment</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCommentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="post-preview">
                <div className="post-header">
                  <div className="post-avatar">{selectedPost.avatar}</div>
                  <div className="post-user">
                    <div className="post-name">{selectedPost.name}</div>
                    <div className="post-meta">{selectedPost.meta}</div>
                  </div>
                </div>
                <div className="post-content">
                  {selectedPost.content}
                </div>
              </div>
              <form onSubmit={handleCommentSubmit}>
                <div className="form-group">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write your comment..."
                    rows="4"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCommentModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!commentText.trim()}
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StudentDashboard;
