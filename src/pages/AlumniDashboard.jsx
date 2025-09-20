import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, orderBy, doc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function AlumniDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { posts, createPost, likePost, addComment } = usePosts();
  const vantaRef = useRef(null);

  // Helper function to calculate real time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}mo ago`;
    }
  };

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
  const [unifiedFeed, setUnifiedFeed] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [postComments, setPostComments] = useState({});
  const [showReplyInput, setShowReplyInput] = useState({});
  const [postReactions, setPostReactions] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState({});
  const [reactionPickerPosition, setReactionPickerPosition] = useState({});
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [createPostData, setCreatePostData] = useState({
    content: '',
    category: 'general',
    privacy: 'public'
  });
  const [isPosting, setIsPosting] = useState(false);

  // Fetch alumni posts from database
  // Unified feed function that merges posts and threads with course-based suggestions
  const fetchUnifiedFeed = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoadingFeed(true);
      
      // Fetch both forum posts and threads
      const [postsSnapshot, threadsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'forum-posts'), orderBy('createdAt', 'desc'), limit(20))),
        getDocs(query(collection(db, 'forum-threads'), orderBy('createdAt', 'desc'), limit(20)))
      ]);
      
      // Process posts
      const posts = postsSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          const timeAgo = data.createdAt ? 
            getTimeAgo(data.createdAt.toDate()) : 
            'Just now';
          
          return {
            id: doc.id,
            type: 'post',
            avatar: data.authorName ? data.authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A',
          name: data.authorName || 'User',
          role: data.authorRole || 'alumni',
          meta: `${data.category || 'General'} • ${timeAgo}`,
          roleLabel: data.authorRole === 'alumni' ? 'Mentor' : data.authorRole === 'student' ? 'Student' : 'User',
            content: data.content || 'No content available',
            title: data.title || '',
            likes: data.likes || 0,
            comments: data.comments || 0,
            createdAt: data.createdAt,
            authorId: data.authorId,
            authorName: data.authorName,
            authorPhoto: data.authorPhoto,
            authorRole: data.authorRole,
            category: data.category,
            privacy: data.privacy
          };
        } catch (error) {
          console.error('Error processing post:', doc.id, error);
          return null;
        }
      }).filter(Boolean);

      // Process threads
      const threads = threadsSnapshot.docs.map(doc => {
        try {
          const data = doc.data();
          const timeAgo = data.createdAt ? 
            getTimeAgo(data.createdAt.toDate()) : 
            'Just now';
          
          return {
            id: doc.id,
            type: 'thread',
            avatar: data.authorName ? data.authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A',
            name: data.authorName || 'User',
            role: data.authorRole || 'alumni',
            meta: `Thread • ${timeAgo}`,
            roleLabel: data.authorRole === 'alumni' ? 'Mentor' : data.authorRole === 'student' ? 'Student' : 'User',
            content: data.content || 'No content available',
            title: data.title || '',
            likes: data.likes || 0,
            comments: data.comments || 0,
            createdAt: data.createdAt,
            authorId: data.authorId,
            authorName: data.authorName,
            authorPhoto: data.authorPhoto,
            authorRole: data.authorRole,
            category: data.category,
            privacy: data.privacy
          };
        } catch (error) {
          console.error('Error processing thread:', doc.id, error);
          return null;
        }
      }).filter(Boolean);

      // Combine and sort by creation time
      const combinedFeed = [...posts, ...threads].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });

      setUnifiedFeed(combinedFeed);
      setFeedPosts(combinedFeed);
    } catch (error) {
      console.error('Error fetching unified feed:', error);
    } finally {
      setIsLoadingFeed(false);
    }
  };

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

  // Post creation functionality
  const handleCreatePostSubmit = async () => {
    if (!currentUser) {
      alert('Please log in to create a post');
      return;
    }

    if (!createPostData.content.trim()) {
      alert('Please enter some content for your post');
      return;
    }

    setIsPosting(true);
    try {
      const postData = {
        content: createPostData.content.trim(),
        category: createPostData.category,
        userId: currentUser.uid,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        authorPhoto: currentUser.photoURL || null,
        authorRole: 'alumni',
        privacy: createPostData.privacy
      };

      // Use the global posts context
      await createPost(postData);

      // Reset form
      setCreatePostData({
        content: '',
        category: 'general',
        privacy: 'public'
      });
      setShowCreatePostModal(false);
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post: ', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Load reactions for existing posts when component mounts or posts change
  useEffect(() => {
    if (feedPosts.length > 0) {
      feedPosts.forEach(post => {
        // Load reactions for each post
        fetchPostReactions(post.id);
      });
    }
  }, [feedPosts, currentUser, fetchPostReactions]);

  // Initialize Vanta.js background
  useEffect(() => {
    if (window.VANTA && vantaRef.current) {
      const vantaEffect = window.VANTA.NET({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x3a82ff,
        backgroundColor: 0x0a0a0a
      });

      return () => {
        if (vantaEffect && vantaEffect.destroy) {
          vantaEffect.destroy();
        }
      };
    }
  }, []);

  // Load unified feed when component mounts
  useEffect(() => {
    fetchUnifiedFeed();
  }, [currentUser, fetchUnifiedFeed]);

  // Reaction types
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' }
  ];

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
      
      // Check if user already reacted
      const existingReaction = postReactions[postId]?.userReaction;
      
      if (existingReaction === reactionType) {
        // Remove reaction
        const userReactionQuery = query(reactionsRef, where('userId', '==', currentUser.uid), where('type', '==', reactionType));
        const existingReactions = await getDocs(userReactionQuery);
        
        if (!existingReactions.empty) {
          const reactionDoc = existingReactions.docs[0];
          await deleteDoc(doc(db, 'forum-posts', postId, 'reactions', reactionDoc.id));
        }
      } else {
        // Remove existing reaction if any
        if (existingReaction) {
          const userReactionQuery = query(reactionsRef, where('userId', '==', currentUser.uid));
          const existingReactions = await getDocs(userReactionQuery);
          
          for (const reactionDoc of existingReactions.docs) {
            await deleteDoc(doc(db, 'forum-posts', postId, 'reactions', reactionDoc.id));
          }
        }
        
        // Add new reaction
        await addDoc(reactionsRef, {
          userId: currentUser.uid,
          type: reactionType,
          createdAt: serverTimestamp()
        });
      }

      // Create notification for post author
      if (post.authorId !== currentUser.uid) {
        await createReactionNotification(post.authorId, postId, reactionType, post.content);
      }

    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const createReactionNotification = async (authorId, postId, reactionType, postContent) => {
    if (authorId === currentUser.uid) return; // Don't notify self

    try {
      const reactionEmoji = reactionTypes.find(r => r.type === reactionType)?.emoji || '👍';
      const reactionLabel = reactionTypes.find(r => r.type === reactionType)?.label || 'Like';
      
      const notification = {
        userId: authorId,
        type: 'reaction',
        title: `${currentUser.displayName || 'Someone'} reacted with ${reactionEmoji}`,
        message: `${reactionLabel} your post: "${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}"`,
        postId: postId,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || 'Someone',
        fromUserPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'notifications'), notification);
    } catch (error) {
      console.error('Error creating reaction notification:', error);
    }
  };

  const handleSharePost = async (postId) => {
    if (!currentUser) {
      alert('Please log in to share posts');
      return;
    }

    try {
      // Create a shared post
      const sharedPost = {
        content: `Shared: ${feedPosts.find(p => p.id === postId)?.content || 'Post'}`,
        category: 'shared',
        userId: currentUser.uid,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        authorPhoto: currentUser.photoURL || null,
        authorRole: 'alumni',
        privacy: 'public',
        originalPostId: postId,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-posts'), sharedPost);
      await fetchUnifiedFeed();
      alert('Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post. Please try again.');
    }
  };

  const handleComment = async (postId) => {
    if (!commentText || !commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    if (!currentUser) {
      alert('Please log in to post a comment');
      return;
    }

    // Find post in both feedPosts and unifiedFeed
    const post = feedPosts.find(p => p.id === postId) || unifiedFeed.find(p => p.id === postId);
    if (!post) {
      console.error('Post not found:', postId);
      alert('Post not found. Please refresh and try again.');
      return;
    }

    try {
      console.log('Posting comment for post:', postId);
      console.log('Post authorId:', post.authorId);
      console.log('Current user:', currentUser.uid);
      
      const commentData = {
        postId: postId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userPhoto: currentUser.photoURL || null,
        content: commentText.trim(),
        createdAt: serverTimestamp()
      };

      // Add comment to Firestore
      await addDoc(collection(db, 'forum-posts', postId, 'comments'), commentData);
      
      // Update comment count
      const postRef = doc(db, 'forum-posts', postId);
      await updateDoc(postRef, {
        comments: (post.comments || 0) + 1,
        updatedAt: serverTimestamp()
      });

      // Create notification for post author
      if (post.authorId && post.authorId !== currentUser.uid) {
        try {
          const notification = {
            userId: post.authorId,
            type: 'comment',
            title: `${currentUser.displayName || 'Someone'} commented on your post`,
            message: `"${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
            postId: postId,
            fromUserId: currentUser.uid,
            fromUserName: currentUser.displayName || 'Someone',
            fromUserPhoto: currentUser.photoURL || null,
            createdAt: serverTimestamp(),
            read: false
          };

          await addDoc(collection(db, 'notifications'), notification);
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError);
          // Don't fail the comment if notification fails
        }
      }

      // Clear comment input and hide input section
      setCommentText('');
      setShowCommentInput(prev => ({ ...prev, [postId]: false }));
      
      // Refresh the feed to show the new comment
      await fetchUnifiedFeed();
      
      console.log('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        alert('You do not have permission to post comments. Please check your account status.');
      } else if (error.code === 'unavailable') {
        alert('Service temporarily unavailable. Please try again in a moment.');
      } else if (error.message.includes('network')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('Failed to post comment. Please try again.');
      }
    }
  };

  const handleReply = async (postId, parentCommentId, replyText) => {
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
      
      const replyData = {
        postId: postId,
        parentCommentId: parentCommentId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userPhoto: currentUser.photoURL || null,
        content: replyText.trim(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-posts', postId, 'comments'), replyData);
      
      // Update comment count
      const postRef = doc(db, 'forum-posts', postId);
      await updateDoc(postRef, {
        comments: (post.comments || 0) + 1
      });

      setShowReplyInput(prev => ({ ...prev, [parentCommentId]: false }));
      await fetchUnifiedFeed();
      alert('Reply posted successfully!');
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
    }
  };

  const handleEditPost = async (postId) => {
    if (!editContent.trim()) {
      alert('Please enter some content for your post.');
      return;
    }

    try {
      const postRef = doc(db, 'forum-posts', postId);
      await updateDoc(postRef, {
        content: editContent.trim(),
        updatedAt: serverTimestamp()
      });
      
      setEditingPost(null);
      setEditContent('');
      await fetchUnifiedFeed();
      alert('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'forum-posts', postId));
      await fetchUnifiedFeed();
      alert('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleMentorshipRequest = async (mentorId) => {
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
      const requestData = {
        studentId: currentUser.uid,
        studentName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
        studentEmail: currentUser.email,
        mentorId: mentorId,
        mentorName: mentor.name,
        status: 'pending',
        message: `Hi ${mentor.name}, I would like to connect with you for mentorship.`,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'mentorship-requests'), requestData);
      
      // Create notification for mentor
      const notification = {
        userId: mentorId,
        type: 'mentorship_request',
        title: 'New Mentorship Request',
        message: `${currentUser.displayName || 'A student'} wants to connect with you for mentorship.`,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || 'Student',
        fromUserPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'notifications'), notification);
      
      alert('Mentorship request sent successfully!');
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      alert('Failed to send mentorship request. Please try again.');
    }
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
      {/* Connectrix Background Image */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: -2,
          backgroundImage: 'url(/assets/image.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      ></div>
      
      {/* Vanta.js Background */}
      <div ref={vantaRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}></div>
      
      {/* Main Dashboard Content */}
      <main className="dashboard" style={{ position: 'relative', zIndex: 1 }}>
        <div className="facebook-dashboard-container">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1 className="welcome-title">
              Welcome back, {currentUser?.firstName && currentUser?.lastName 
                             ? `${currentUser.firstName} ${currentUser.lastName}`
                             : currentUser?.displayName || 
                             (currentUser?.email ? currentUser.email.split('@')[0] : 'User')}!
            </h1>
            <p className="welcome-subtitle">Here's what's happening with your mentorship network today.</p>
          </div>

          {/* Facebook-style Layout */}
          <div className="facebook-layout">
            {/* Main Content - Forum Feed */}
            <div className="facebook-main-content">
              {/* What's on your mind? Section */}
              <div className="whats-on-mind-card">
                <div className="post-creation-header">
                  <div className="post-author">
                    <div className="post-avatar">
                      {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" />
                      ) : (
                        <div className="post-initials">
                          {currentUser?.displayName ? currentUser.displayName[0] : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="post-input">
                    <input 
                      id="create-post-trigger"
                      name="createPostTrigger"
                      type="text" 
                      placeholder="What's on your mind?"
                      className="post-text-input"
                      onClick={() => setShowCreatePostModal(true)}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                <div className="post-creation-options">
                  <button 
                    className="post-option live-video"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <i className="fas fa-video"></i>
                    Live video
                  </button>
                  <button 
                    className="post-option photo-video"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <i className="fas fa-image"></i>
                    Photo/video
                  </button>
                  <button 
                    className="post-option feeling"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <i className="fas fa-smile"></i>
                    Feeling/activity
                  </button>
                </div>
              </div>

              {/* Recent Student Activity - Facebook Style */}
              <div className="posts-feed">
                <h2 className="section-title">Recent Student Activity</h2>
                {feedPosts.length === 0 ? (
                  <div className="no-posts">
                    <p>No posts yet. Be the first to share something!</p>
                  </div>
                ) : (
                  <div className="posts-list">
                    {feedPosts.map((post) => (
                      <div key={post.id} className="post-card facebook-post-card">
                        <div className="post-header">
                          <div className="post-author-info">
                            <div className="post-author-avatar">
                              {post.authorPhoto ? (
                                <img src={post.authorPhoto} alt="Profile" />
                              ) : (
                                <div className="post-initials">
                                  {post.authorName ? post.authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                </div>
                              )}
                            </div>
                            <div className="post-author-details">
                              <span className="post-author-name">{post.authorName}</span>
                              <div className="post-meta">
                                <span className="post-time">{post.createdAt ? getTimeAgo(post.createdAt.toDate()) : 'Recently'}</span>
                                <span className="post-role">{post.authorRole || 'student'}</span>
                                <i className="fas fa-globe"></i>
                              </div>
                            </div>
                          </div>
                          <button className="post-options-btn">
                            <i className="fas fa-ellipsis-h"></i>
                          </button>
                        </div>
                        <div className="post-content">
                          <p>{post.content}</p>
                        </div>
                        <div className="post-actions">
                          <button 
                            className="post-action"
                            onClick={() => handleReaction(post.id, 'like')}
                          >
                            <i className="fas fa-thumbs-up"></i>
                            Like ({postReactions[post.id]?.counts?.like || 0})
                          </button>
                          <button 
                            className="post-action"
                            onClick={() => setShowCommentInput(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                          >
                            <i className="fas fa-comment"></i>
                            Comment ({post.comments || 0})
                          </button>
                          <button 
                            className="post-action"
                            onClick={() => handleSharePost(post.id)}
                          >
                            <i className="fas fa-share"></i>
                            Share
                          </button>
                        </div>
                        
                        {/* Comment Input */}
                        {showCommentInput[post.id] && (
                          <div className="comment-input-section">
                            <div className="comment-input">
                              <div className="comment-avatar">
                                {currentUser?.photoURL ? (
                                  <img src={currentUser.photoURL} alt="Profile" />
                                ) : (
                                  <div className="comment-initials">
                                    {currentUser?.displayName?.charAt(0) || 'U'}
                                  </div>
                                )}
                              </div>
                              <div className="comment-input-field">
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleComment(post.id);
                                    }
                                  }}
                                />
                                <button 
                                  className="comment-submit-btn"
                                  onClick={() => handleComment(post.id)}
                                >
                                  <i className="fas fa-paper-plane"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Open Forum Section */}
              <section className="open-forum">
            <div className="forum-header">
              <h2 className="section-title">Open Forum</h2>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/forum')}
              >
                View All Posts <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            <div className="feed-container">
              {/* Post Creation Interface */}
              <div className="post-creation-card">
                <div className="post-creation-header">
                  <div className="post-creation-avatar">
                    {currentUser?.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Profile" 
                        className="creation-profile-image"
                      />
                    ) : currentUser?.profilePictureBase64 ? (
                      <img 
                        src={currentUser.profilePictureBase64} 
                        alt="Profile" 
                        className="creation-profile-image"
                      />
                    ) : (
                      <div className="creation-profile-initial">
                        {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div 
                    className="post-creation-input"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    What's on your mind?
                  </div>
                </div>
                
                <div className="post-creation-separator"></div>
                
                <div className="post-creation-actions">
                  <button 
                    className="creation-action-btn"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <i className="fas fa-video"></i>
                    <span>Live video</span>
                  </button>
                  <button 
                    className="creation-action-btn"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <i className="fas fa-image"></i>
                    <span>Photo/video</span>
                  </button>
                  <button 
                    className="creation-action-btn"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <i className="fas fa-smile"></i>
                    <span>Feeling/activity</span>
                  </button>
                </div>
              </div>

              {/* Unified Feed */}
              <div className="unified-feed">
                {isLoadingFeed ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading posts...</p>
                  </div>
                ) : unifiedFeed.length === 0 ? (
                  <div className="no-posts">
                    <div className="no-posts-icon">
                      <i className="fas fa-comments"></i>
                    </div>
                    <h3>No posts yet</h3>
                    <p>Be the first to share something in the forum!</p>
                  </div>
                ) : (
                  <div className="feed-posts">
                    {unifiedFeed.map((item) => (
                      <div key={item.id} className="feed-post">
                        <div className="post-header">
                          <div className="post-author">
                            <div className="post-avatar">
                              {item.authorPhoto ? (
                                <img src={item.authorPhoto} alt="Profile" />
                              ) : (
                                <div className="post-initials">
                                  {item.avatar}
                                </div>
                              )}
                            </div>
                            <div className="post-author-info">
                              <div className="post-author-name">
                                {item.name}
                                {item.roleLabel && (
                                  <span className={`role-badge ${item.roleLabel.toLowerCase()}`}>
                                    {item.roleLabel}
                                  </span>
                                )}
                              </div>
                              <div className="post-meta">
                                <span className="post-time">{item.meta}</span>
                                <i className="fas fa-globe"></i>
                              </div>
                            </div>
                          </div>
                          <div className="post-options">
                            <button className="post-option-btn">
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                          </div>
                        </div>
                        
                        <div className="post-content">
                          <p>{item.content}</p>
                        </div>
                        
                        <div className="post-actions">
                          <div className="post-reactions">
                            <button 
                              className={`reaction-btn ${postReactions[item.id]?.userReaction === 'like' ? 'active' : ''}`}
                              onClick={() => handleReaction(item.id, 'like')}
                            >
                              <i className="fas fa-thumbs-up"></i>
                              <span>{postReactions[item.id]?.counts?.like || 0}</span>
                            </button>
                            <button 
                              className={`reaction-btn ${postReactions[item.id]?.userReaction === 'love' ? 'active' : ''}`}
                              onClick={() => handleReaction(item.id, 'love')}
                            >
                              <i className="fas fa-heart"></i>
                              <span>{postReactions[item.id]?.counts?.love || 0}</span>
                            </button>
                            <button 
                              className={`reaction-btn ${postReactions[item.id]?.userReaction === 'laugh' ? 'active' : ''}`}
                              onClick={() => handleReaction(item.id, 'laugh')}
                            >
                              <i className="fas fa-laugh"></i>
                              <span>{postReactions[item.id]?.counts?.laugh || 0}</span>
                            </button>
                          </div>
                          
                          <div className="post-interactions">
                            <button 
                              className="interaction-btn"
                              onClick={() => setShowCommentInput(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                            >
                              <i className="fas fa-comment"></i>
                              <span>Comment</span>
                            </button>
                            <button 
                              className="interaction-btn"
                              onClick={() => handleSharePost(item.id)}
                            >
                              <i className="fas fa-share"></i>
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Comment Input */}
                        {showCommentInput[item.id] && (
                          <div className="comment-input-section">
                            <div className="comment-input">
                              <div className="comment-avatar">
                                {currentUser?.photoURL ? (
                                  <img src={currentUser.photoURL} alt="Profile" />
                                ) : (
                                  <div className="comment-initials">
                                    {currentUser?.displayName?.charAt(0) || 'U'}
                                  </div>
                                )}
                              </div>
                              <div className="comment-input-field">
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleComment(item.id);
                                    }
                                  }}
                                />
                                <button 
                                  className="comment-submit-btn"
                                  onClick={() => handleComment(item.id)}
                                >
                                  <i className="fas fa-paper-plane"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
            </div>

            {/* Sidebar */}
            <div className="facebook-sidebar">
              {/* Quick Access */}
              <div className="sidebar-section">
                <h3 className="sidebar-title">Quick Access</h3>
                <div className="quick-access-grid">
                  <button 
                    className="quick-access-card"
                    onClick={() => navigate('/mentorship')}
                  >
                    <div className="quick-access-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <span>Mentorship</span>
                  </button>
                  <button 
                    className="quick-access-card"
                    onClick={() => navigate('/events')}
                  >
                    <div className="quick-access-icon">
                      <i className="fas fa-calendar"></i>
                    </div>
                    <span>Events</span>
                  </button>
                  <button 
                    className="quick-access-card"
                    onClick={() => navigate('/messaging')}
                  >
                    <div className="quick-access-icon">
                      <i className="fas fa-comments"></i>
                    </div>
                    <span>Messages</span>
                  </button>
                  <button 
                    className="quick-access-card"
                    onClick={() => navigate('/profile')}
                  >
                    <div className="quick-access-icon">
                      <i className="fas fa-user"></i>
                    </div>
                    <span>Profile</span>
                  </button>
                </div>
              </div>

              {/* Suggested Mentors */}
              <div className="sidebar-section">
                <h3 className="sidebar-title">Suggested Mentors</h3>
                <div className="suggested-mentors">
                  {suggestedMentors.slice(0, 3).map((mentor) => (
                    <div key={mentor.id} className="mentor-card">
                      <div className="mentor-avatar">
                        <div className="mentor-initials">{mentor.avatar}</div>
                      </div>
                      <div className="mentor-info">
                        <div className="mentor-name">{mentor.name}</div>
                        <div className="mentor-meta">{mentor.meta}</div>
                      </div>
                      <button 
                        className="mentor-connect-btn"
                        onClick={() => handleMentorshipRequest(mentor.id)}
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Post</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreatePostModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="post-creation-form">
                <div className="form-group">
                  <label>Content</label>
                  <textarea
                    value={createPostData.content}
                    onChange={(e) => setCreatePostData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="What's on your mind?"
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={createPostData.category}
                    onChange={(e) => setCreatePostData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="general">General</option>
                    <option value="job">Job</option>
                    <option value="tip">Tip</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Privacy</label>
                  <select
                    value={createPostData.privacy}
                    onChange={(e) => setCreatePostData(prev => ({ ...prev, privacy: e.target.value }))}
                  >
                    <option value="public">Public</option>
                    <option value="alumni">Alumni Only</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowCreatePostModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreatePostSubmit}
                disabled={isPosting}
              >
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AlumniDashboard;