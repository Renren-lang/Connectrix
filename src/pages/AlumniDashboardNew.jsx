import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, limit, orderBy, doc, updateDoc, addDoc, serverTimestamp, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import DashboardLayout from '../components/DashboardLayout';

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
  const [postReactions, setPostReactions] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState({});
  const [reactionPickerPosition, setReactionPickerPosition] = useState({});
  const [commentReactions, setCommentReactions] = useState({});
  const [showCommentReactionPicker, setShowCommentReactionPicker] = useState({});
  const [commentReactionPickerPosition, setCommentReactionPickerPosition] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState(null);
        
  // Facebook-like reaction types
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' }
  ];


  // Fetch posts from Firestore
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsRef = collection(db, 'forum-posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const posts = [];
        querySnapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() });
        });
        setFeedPosts(posts);
        setIsLoadingPosts(false);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  // Load comments for existing posts on mount
  useEffect(() => {
    if (feedPosts.length > 0) {
      feedPosts.forEach(post => {
        fetchCommentsForPost(post.id);
      });
    }
  }, [feedPosts]);

  // Fetch reactions for posts
  useEffect(() => {
    if (feedPosts.length > 0) {
      feedPosts.forEach(post => {
        fetchPostReactions(post.id);
      });
    }
  }, [feedPosts]);

  const fetchCommentsForPost = async (postId) => {
    try {
      const commentsRef = collection(db, 'post-comments');
      const q = query(
        commentsRef,
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const postComments = [];
      querySnapshot.forEach((doc) => {
        postComments.push({ id: doc.id, ...doc.data() });
      });
      setComments(prev => ({ ...prev, [postId]: postComments }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Fallback query without orderBy if index is building
      try {
        const commentsRef = collection(db, 'post-comments');
        const q = query(commentsRef, where('postId', '==', postId));
        const querySnapshot = await getDocs(q);
        const postComments = [];
        querySnapshot.forEach((doc) => {
          postComments.push({ id: doc.id, ...doc.data() });
        });
        // Sort client-side
        postComments.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return a.createdAt.toDate() - b.createdAt.toDate();
          }
          return 0;
        });
        setComments(prev => ({ ...prev, [postId]: postComments }));
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
      }
    }
  };

  const fetchPostReactions = async (postId) => {
    try {
      const reactionsRef = collection(db, `posts/${postId}/reactions`);
      const querySnapshot = await getDocs(reactionsRef);
      const reactions = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.reactionType) {
          reactions[data.reactionType] = (reactions[data.reactionType] || 0) + 1;
        }
      });
      setPostReactions(prev => ({ ...prev, [postId]: reactions }));
    } catch (error) {
      console.error('Error fetching reactions for post:', error);
    }
  };

  const handleCommentSubmit = async (postId, commentText, parentCommentId = null) => {
    if (!commentText.trim() || !currentUser) return;
    
    try {
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
      
      // Clear input
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setReplyingTo(prev => ({ ...prev, [postId]: null }));
      
      // Refresh comments
      fetchCommentsForPost(postId);
      
      // Create notification
      const post = feedPosts.find(p => p.id === postId);
      if (post && post.authorId) {
        createCommentNotification(post.authorId, postId, authorName, commentText.trim());
      }
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    }
  };

  const createCommentNotification = async (recipientId, postId, authorName, commentContent) => {
    try {
      if (!recipientId || !postId || !authorName || !commentContent) return;
      
      const notificationData = {
        recipientId,
        type: 'comment',
        title: 'New Comment',
        message: `${authorName} commented on your post`,
        postId,
        authorId: currentUser.uid,
        authorName,
        commentContent,
        read: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error creating comment notification:', error);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) return;

    try {
      const reactionRef = doc(db, `posts/${postId}/reactions`, `${currentUser.uid}_${reactionType}`);
      
      // Check if user already reacted with this type
      const existingReaction = postReactions[postId]?.[reactionType];
      
      if (existingReaction) {
        // Remove reaction
        await deleteDoc(reactionRef);
      } else {
        // Add reaction
        await addDoc(collection(db, `posts/${postId}/reactions`), {
          userId: currentUser.uid,
          reactionType,
          createdAt: serverTimestamp()
        });
      }

      // Refresh reactions
      fetchPostReactions(postId);
      
      // Create notification
      const post = feedPosts.find(p => p.id === postId);
      if (post && post.authorId && post.authorId !== currentUser.uid) {
        createReactionNotification(post.authorId, postId, reactionType, post.content);
      }
      
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const createReactionNotification = async (recipientId, postId, reactionType, postContent) => {
    try {
      if (!recipientId || !postId || !reactionType || !postContent) return;
      
      const reactionEmoji = reactionTypes.find(r => r.type === reactionType)?.emoji || '👍';
      const notificationData = {
        recipientId,
        type: 'reaction',
        title: 'New Reaction',
        message: `Someone reacted ${reactionEmoji} to your post`,
        postId,
        authorId: currentUser.uid,
        reactionType,
        read: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error creating reaction notification:', error);
    }
  };

  const handleReactionLongPress = (e, postId) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setReactionPickerPosition({
      [postId]: {
        x: rect.left + rect.width / 2,
        y: rect.top - 80
      }
    });
    setShowReactionPicker({ [postId]: true });
  };

  const handleReactionSelect = (postId, reactionType) => {
    event.nativeEvent.stopImmediatePropagation();
    handleReaction(postId, reactionType);
    setShowReactionPicker({ [postId]: false });
  };

  const hideReactionPicker = () => {
    setShowReactionPicker({});
  };

  const handleReactionPickerMouseEnter = () => {
    // Keep picker open when hovering
  };

  const handleCommentReaction = async (commentId, reactionType) => {
    if (!currentUser) return;

    try {
      const reactionRef = doc(db, `post-comments/${commentId}/reactions`, `${currentUser.uid}_${reactionType}`);
      
      // Check if user already reacted with this type
      const existingReaction = commentReactions[commentId]?.[reactionType];
      
      if (existingReaction) {
        // Remove reaction
        await deleteDoc(reactionRef);
      } else {
        // Add reaction
        await addDoc(collection(db, `post-comments/${commentId}/reactions`), {
          userId: currentUser.uid,
          reactionType,
          createdAt: serverTimestamp()
        });
      }

      // Refresh reactions
      fetchCommentReactions(commentId);
      
    } catch (error) {
      console.error('Error handling comment reaction:', error);
    }
  };

  const fetchCommentReactions = async (commentId) => {
    try {
      const reactionsRef = collection(db, `post-comments/${commentId}/reactions`);
      const querySnapshot = await getDocs(reactionsRef);
      const reactions = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.reactionType) {
          reactions[data.reactionType] = (reactions[data.reactionType] || 0) + 1;
        }
      });
      setCommentReactions(prev => ({ ...prev, [commentId]: reactions }));
    } catch (error) {
      console.error('Error fetching comment reactions:', error);
    }
  };

  const handleCommentReactionLongPress = (e, commentId) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setCommentReactionPickerPosition({
      [commentId]: {
        x: rect.left + rect.width / 2,
        y: rect.top - 80
      }
    });
    setShowCommentReactionPicker({ [commentId]: true });
  };

  const handleCommentReactionSelect = (commentId, reactionType) => {
    event.nativeEvent.stopImmediatePropagation();
    handleCommentReaction(commentId, reactionType);
    setShowCommentReactionPicker({ [commentId]: false });
  };

  const hideCommentReactionPicker = () => {
    setShowCommentReactionPicker({});
  };

  const handleCommentReactionPickerMouseEnter = () => {
    // Keep picker open when hovering
  };

  const handleSharePost = (post) => {
    setSelectedPostForShare(post);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSelectedPostForShare(null);
  };

  const copyPostLink = () => {
    const postUrl = `${window.location.origin}/forum#post-${selectedPostForShare.id}`;
    navigator.clipboard.writeText(postUrl);
    alert('Post link copied to clipboard!');
  };

  const shareOnFacebook = () => {
    const postUrl = encodeURIComponent(`${window.location.origin}/forum#post-${selectedPostForShare.id}`);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${postUrl}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const postUrl = encodeURIComponent(`${window.location.origin}/forum#post-${selectedPostForShare.id}`);
    const text = encodeURIComponent(`Check out this post on Connectrix: ${selectedPostForShare.content.substring(0, 100)}...`);
    const twitterUrl = `https://twitter.com/intent/tweet?url=${postUrl}&text=${text}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const postUrl = encodeURIComponent(`${window.location.origin}/forum#post-${selectedPostForShare.id}`);
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${postUrl}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const postUrl = `${window.location.origin}/forum#post-${selectedPostForShare.id}`;
    const subject = encodeURIComponent('Check out this post on Connectrix');
    const body = encodeURIComponent(`I thought you might be interested in this post:\n\n${selectedPostForShare.content}\n\nRead more: ${postUrl}`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
  };

  const handleAcceptRequest = (requestId) => {
    setMentorshipRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'accepted' } : req
      )
    );
  };

  const handleDeclineRequest = (requestId) => {
    setMentorshipRequests(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: 'declined' } : req
      )
    );
  };

  const filteredRequests = mentorshipRequests.filter(request => 
    activeFilter === 'All' || request.status === activeFilter.toLowerCase()
  );

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const postTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <DashboardLayout userRole="alumni">
      {/* Connectrix Background Image */}
      <div 
        style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1,
          backgroundImage: 'url(/assets/image.png)', backgroundSize: 'cover',
          backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed'
        }}
      ></div>
      
      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="welcome-title">
            Welcome back, {currentUser?.displayName || 'Alumni'}!
          </h1>
          <p className="welcome-subtitle">
            Here's what's happening with your mentorship network today.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Mentorship Requests */}
          <div className="dashboard-card-container">
            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">Mentorship Requests</h2>
                <div className="filter-buttons">
                  {['All', 'Pending', 'Accepted', 'Declined'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredRequests.map(request => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {request.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{request.name}</h3>
                        <p className="text-sm text-gray-600">{request.details}</p>
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Student Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Student Activity</h2>
              
              {isLoadingPosts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {feedPosts.map(post => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {post.authorName?.charAt(0) || 'S'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-800">{post.authorName || 'Student'}</h3>
                            <span className="text-sm text-gray-500">{post.authorRole || 'Student'}</span>
                            <span className="text-sm text-gray-400">•</span>
                            <span className="text-sm text-gray-400">{formatTimeAgo(post.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 mt-1">{post.content}</p>
                        </div>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          <button
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                            onMouseDown={(e) => handleReactionLongPress(e, post.id)}
                            onMouseLeave={hideReactionPicker}
                          >
                            <span>👍</span>
                            <span className="text-sm">
                              {Object.values(postReactions[post.id] || {}).reduce((sum, count) => sum + count, 0) || 0}
                            </span>
                          </button>
                          
                          <button
                            onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <span>💬</span>
                            <span className="text-sm">Comment</span>
                          </button>
                          
                          <button
                            onClick={() => handleSharePost(post)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <span>📤</span>
                            <span className="text-sm">Share</span>
                          </button>
                        </div>
                      </div>

                      {/* Reaction Picker */}
                      {showReactionPicker[post.id] && (
                        <div
                          className="reaction-picker"
                          style={{
                            position: 'fixed',
                            left: reactionPickerPosition[post.id]?.x - 60,
                            top: reactionPickerPosition[post.id]?.y,
                            zIndex: 1000
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="reaction-picker-content">
                            {reactionTypes.map((reaction) => (
                              <button
                                key={reaction.type}
                                className="reaction-option"
                                onClick={() => handleReactionSelect(post.id, reaction.type)}
                                onMouseEnter={handleReactionPickerMouseEnter}
                              >
                                <span className="reaction-emoji">{reaction.emoji}</span>
                                <span className="reaction-label">{reaction.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments Section */}
                      {(expandedComments[post.id] || (comments[post.id] && comments[post.id].length > 0)) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {/* Comments List */}
                          {comments[post.id] && comments[post.id].length > 0 && (
                            <div className="space-y-3 mb-4">
                              {comments[post.id].map(comment => (
                                <div key={comment.id} className="flex items-start space-x-3">
                                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                      {comment.authorName?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-sm text-gray-800">{comment.authorName}</span>
                                      <span className="text-xs text-gray-500">{comment.authorRole}</span>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                                    
                                    {/* Comment Reactions */}
                                    <div className="flex items-center space-x-2 mt-2">
                                      <button
                                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                                        onMouseDown={(e) => handleCommentReactionLongPress(e, comment.id)}
                                        onMouseLeave={hideCommentReactionPicker}
                                      >
                                        <span className="text-xs">👍</span>
                                        <span className="text-xs">
                                          {Object.values(commentReactions[comment.id] || {}).reduce((sum, count) => sum + count, 0) || 0}
                                        </span>
                                      </button>
                                    </div>

                                    {/* Comment Reaction Picker */}
                                    {showCommentReactionPicker[comment.id] && (
                                      <div
                                        className="comment-reaction-picker"
                                        style={{
                                          position: 'fixed',
                                          left: commentReactionPickerPosition[comment.id]?.x - 60,
                                          top: commentReactionPickerPosition[comment.id]?.y,
                                          zIndex: 1000
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        <div className="reaction-picker-content">
                                          {reactionTypes.map((reaction) => (
                                            <button
                                              key={reaction.type}
                                              className="reaction-option"
                                              onClick={() => handleCommentReactionSelect(comment.id, reaction.type)}
                                              onMouseEnter={handleCommentReactionPickerMouseEnter}
                                            >
                                              <span className="reaction-emoji">{reaction.emoji}</span>
                                              <span className="reaction-label">{reaction.label}</span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Comment Input */}
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {currentUser?.displayName?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder="Write a comment..."
                                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                              />
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={() => handleCommentSubmit(post.id, commentInputs[post.id])}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Comment
                                </button>
                              </div>
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
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && selectedPostForShare && (
        <div className="modal-overlay" onClick={closeShareModal}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Share Post</h3>
              <button onClick={closeShareModal} className="close-btn">×</button>
            </div>
            
            <div className="share-post-preview">
              <div className="post-preview-header">
                <div className="post-preview-avatar">
                  {selectedPostForShare.authorName?.charAt(0) || 'S'}
                </div>
                <div className="post-preview-info">
                  <div className="post-preview-author">{selectedPostForShare.authorName || 'Student'}</div>
                  <div className="post-preview-role">{selectedPostForShare.authorRole || 'Student'}</div>
                </div>
              </div>
              <div className="post-preview-content">
                {selectedPostForShare.content}
              </div>
            </div>
            
            <div className="share-options">
              <button onClick={copyPostLink} className="share-option">
                <span>🔗</span>
                <span>Copy Link</span>
              </button>
              <button onClick={shareOnFacebook} className="share-option">
                <span>📘</span>
                <span>Facebook</span>
              </button>
              <button onClick={shareOnTwitter} className="share-option">
                <span>🐦</span>
                <span>Twitter</span>
              </button>
              <button onClick={shareOnLinkedIn} className="share-option">
                <span>💼</span>
                <span>LinkedIn</span>
              </button>
              <button onClick={shareViaEmail} className="share-option">
                <span>📧</span>
                <span>Email</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AlumniDashboard;
