import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Forum.css';

function Forum() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('career');
  const [activeView, setActiveView] = useState('threads'); // 'threads' or 'detail'
  const [selectedThread, setSelectedThread] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateChoiceModal, setShowCreateChoiceModal] = useState(false);
  const [activeSort, setActiveSort] = useState('Latest');
  const [replyContent, setReplyContent] = useState('');
  const [createThreadData, setCreateThreadData] = useState({
    category: '',
    title: '',
    content: ''
  });
  const [createPostData, setCreatePostData] = useState({
    content: '',
    privacy: 'public'
  });
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { id: 'career', name: 'Career Advice', icon: 'fas fa-briefcase', count: 0, description: 'Discuss career paths, job opportunities, and professional growth' },
    { id: 'technical', name: 'Technical Discussions', icon: 'fas fa-code', count: 0, description: 'Share technical knowledge, programming tips, and tech trends' },
    { id: 'general', name: 'General', icon: 'fas fa-comments', count: 0, description: 'General discussions about various topics' },
    { id: 'events', name: 'Events & Meetups', icon: 'fas fa-calendar-alt', count: 0, description: 'Information about upcoming events and meetups' },
    { id: 'alumni', name: 'Alumni Stories', icon: 'fas fa-user-graduate', count: 0, description: 'Stories and experiences from alumni' }
  ];

  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [userReactions, setUserReactions] = useState({});
  const [comments, setComments] = useState([]);
  const [showReplyToComment, setShowReplyToComment] = useState(null);
  const [replyToCommentText, setReplyToCommentText] = useState('');

  // Facebook-like reaction types
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' }
  ];

  // Reset view to threads when component mounts
  useEffect(() => {
    setActiveView('threads');
    setSelectedThread(null);
  }, []);

  // Check for createPost URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('createPost') === 'true') {
      setShowCreatePostModal(true);
      // Clean up the URL parameter
      navigate('/forum', { replace: true });
    }
  }, [location.search, navigate]);

  // Fetch threads when category changes
  useEffect(() => {
    if (activeCategory) {
      fetchThreads();
    }
  }, [activeCategory, activeSort]);

  // Fetch comments when thread is selected
  useEffect(() => {
    if (selectedThread) {
      fetchComments(selectedThread.id);
    }
  }, [selectedThread]);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const threadsRef = collection(db, 'forum-threads');
      
      // Fetch all threads and do client-side filtering and sorting to avoid index requirements
      const q = query(threadsRef);
      const querySnapshot = await getDocs(q);
      
      let threadsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by category
      threadsData = threadsData.filter(thread => thread.category === activeCategory);

      // Apply sorting
      switch (activeSort) {
        case 'Latest':
          threadsData.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          });
          break;
        case 'Popular':
          threadsData.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
        case 'Unanswered':
          threadsData = threadsData.filter(thread => (thread.replyCount || 0) === 0);
          threadsData.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          });
          break;
        default:
          threadsData.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          });
      }

      setThreads(threadsData);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (threadId) => {
    try {
      const commentsRef = collection(db, 'forum-comments');
      const q = query(commentsRef);
      const querySnapshot = await getDocs(q);
      const allComments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by threadId and sort by createdAt on client side
      const commentsData = allComments
        .filter(comment => comment.threadId === threadId)
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return aTime - bTime;
        });
      
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setActiveView('threads');
    setSelectedThread(null);
  };

  const handleSortChange = (sortBy) => {
    setActiveSort(sortBy);
  };

  const handleThreadClick = (thread) => {
    setSelectedThread(thread);
    setActiveView('detail');
  };

  const handleCreateThread = () => {
    setShowCreateModal(true);
  };

  const handleCreateThreadInputChange = (e) => {
    const { name, value } = e.target;
    setCreateThreadData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateThreadSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please log in to create a thread');
      return;
    }

    try {
      const threadData = {
        ...createThreadData,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}` || 'Anonymous',
        authorPhoto: currentUser.photoURL || currentUser.profilePictureBase64 || null,
        likes: 0,
        replyCount: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-threads'), threadData);
      setCreateThreadData({ category: '', title: '', content: '' });
      setShowCreateModal(false);
      fetchThreads();
    } catch (error) {
      console.error('Error creating thread:', error);
      console.error('Error details:', error.message);
      alert(`Failed to create thread: ${error.message}. Please try again.`);
    }
  };

  const handleCreatePostSubmit = async () => {
    if (!currentUser) {
      alert('Please log in to create a post');
      return;
    }

    if (!createPostData.content.trim()) {
      alert('Please enter some content for your post');
      return;
    }

    try {
      const postData = {
        content: createPostData.content.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}` || 'Anonymous',
        authorPhoto: currentUser.photoURL || currentUser.profilePictureBase64 || null,
        authorRole: currentUser.role || 'student',
        category: 'general',
        likes: 0,
        replyCount: 0,
        privacy: createPostData.privacy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-posts'), postData);
      setCreatePostData({ content: '', privacy: 'public' });
      setShowCreatePostModal(false);
      fetchThreads(); // Refresh the forum
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedThread) {
      alert('Please log in to reply');
      return;
    }

    if (!replyContent.trim()) {
      alert('Please enter a reply');
      return;
    }

    try {
      const replyData = {
        threadId: selectedThread.id,
        content: replyContent.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}` || 'Anonymous',
        authorPhoto: currentUser.photoURL || currentUser.profilePictureBase64 || null,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-comments'), replyData);

      // Update thread reply count
      const threadRef = doc(db, 'forum-threads', selectedThread.id);
      await updateDoc(threadRef, {
        replyCount: (selectedThread.replyCount || 0) + 1,
        updatedAt: serverTimestamp()
      });

      setReplyContent('');
      fetchComments(selectedThread.id);
      fetchThreads(); // Refresh threads to update reply count
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply. Please try again.');
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) {
      alert('Please log in to react to posts');
      return;
    }

    try {
      const post = threads.find(p => p.id === postId);
      if (!post) return;

      const reactionsRef = collection(db, `forum-threads/${postId}/reactions`);
      const userReactionQuery = query(
        reactionsRef,
        where('userId', '==', currentUser.uid)
      );
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
        await createReactionNotification(post.authorId, postId, reactionType, post.title);
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
          await createReactionNotification(post.authorId, postId, reactionType, post.title);
        }
      }

      console.log('Reaction handled successfully, refreshing posts...');
      
      // Simple refresh - reload the posts
      window.location.reload();
      
    } catch (error) {
      console.error('Error handling reaction:', error);
      alert('Failed to react to post. Please try again.');
    }
  };

  const createReactionNotification = async (authorId, postId, reactionType, postTitle) => {
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
        message: `${currentUser.displayName || 'Someone'} reacted with ${reactionLabel} to your post "${postTitle}"`,
        data: {
          postId: postId,
          reactionType: reactionType,
          postTitle: postTitle
        },
        read: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notification);
      console.log('Notification created successfully');
    } catch (error) {
      console.error('Error creating reaction notification:', error);
      // Don't throw error, just log it
    }
  };

  const handlePostAction = (postId, action) => {
    if (action === 'like') {
      handleReaction(postId, 'like');
    } else if (action === 'comment') {
      // Scroll to comment form
      const commentForm = document.querySelector('.reply-form');
      if (commentForm) {
        commentForm.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('reply-content')?.focus();
      }
    } else if (action === 'share') {
      handleSharePost(postId);
    }
  };

  const handleSharePost = async (postId) => {
    if (!currentUser) {
      alert('Please log in to share posts');
      return;
    }

    try {
      const post = threads.find(p => p.id === postId);
      if (!post) return;

      // Create a shared post
      const sharedPostData = {
        originalPostId: postId,
        originalAuthorId: post.authorId,
        originalAuthorName: post.authorName,
        sharedBy: currentUser.uid,
        sharedByName: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}` || 'Anonymous',
        content: `Shared: ${post.title}`,
        category: post.category,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-threads'), sharedPostData);
      alert('Post shared successfully!');
      fetchThreads();
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInSeconds = (now - date) / 1000;

      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}m`;
      } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}h`;
      } else {
        return `${Math.floor(diffInSeconds / 86400)}d`;
      }
    } catch (error) {
      return '';
    }
  };

  const currentCategory = categories.find(cat => cat.id === activeCategory);

  return (
    <>
      {/* Main Content */}
      <div className="dashboard-container">
        <div className="main-content">
          {/* Forum Sidebar */}
          <div className="forum-sidebar">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Categories</h2>
            </div>
            <div className="sidebar-menu">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <i className={category.icon}></i>
                  <span>{category.name}</span>
                  <span className="thread-count">{category.count}</span>
                </div>
              ))}
            </div>
            <div className="create-buttons">
              <button className="create-unified-btn" onClick={() => setShowCreateChoiceModal(true)}>
                <i className="fas fa-plus"></i> Create New Content
              </button>
            </div>
          </div>

          {/* Forum Content */}
          <div className="forum-content">
            {/* Threads List View */}
            {activeView === 'threads' && (
              <div className="threads-view">
                {/* Category Header */}
                <div className="category-header">
                  <h1 className="category-title">{currentCategory?.name}</h1>
                  <p className="category-description">{currentCategory?.description}</p>
                </div>

                {/* Threads Container */}
                <div className="threads-container">
                  <div className="threads-header">
                    <h2 className="threads-title">Threads</h2>
                    <div className="sort-options">
                      {['Latest', 'Popular', 'Unanswered'].map(sortBy => (
                        <button
                          key={sortBy}
                          className={`sort-btn ${activeSort === sortBy ? 'active' : ''}`}
                          onClick={() => handleSortChange(sortBy)}
                        >
                          {sortBy}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Threads List */}
                  <div className="threads-list">
                    {isLoading ? (
                      <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading threads...</p>
                      </div>
                    ) : threads.length === 0 ? (
                      <div className="no-threads">
                        <i className="fas fa-comments"></i>
                        <h3>No threads yet</h3>
                        <p>Be the first to start a discussion in this category!</p>
                        <button className="btn btn-primary" onClick={handleCreateThread}>
                          Create First Thread
                        </button>
                      </div>
                    ) : (
                      threads.map(thread => (
                        <div key={thread.id} className="thread-item" onClick={() => handleThreadClick(thread)}>
                          <div className="thread-avatar">
                            {thread.authorPhoto ? (
                              <img src={thread.authorPhoto} alt="Profile" />
                            ) : (
                              <i className="fas fa-user"></i>
                            )}
                          </div>
                          <div className="thread-content">
                            <div className="thread-header">
                              <h3 className="thread-title">{thread.title}</h3>
                              <span className="thread-time">{formatTime(thread.createdAt)}</span>
                            </div>
                            <p className="thread-preview">{thread.content.substring(0, 150)}...</p>
                            <div className="thread-meta">
                              <span className="thread-author">by {thread.authorName}</span>
                              <div className="thread-stats">
                                <span className="thread-replies">
                                  <i className="fas fa-comment"></i> {thread.replyCount || 0}
                                </span>
                                <span className="thread-views">
                                  <i className="fas fa-eye"></i> {thread.views || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="thread-actions">
                            <button 
                              className="action-btn like-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReaction(thread.id, 'like');
                              }}
                            >
                              <i className="far fa-thumbs-up"></i>
                              <span>{thread.likes || 0}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Thread Detail View */}
            {activeView === 'detail' && selectedThread && (
              <div className="thread-detail">
                <div className="detail-header">
                  <button className="back-btn" onClick={() => setActiveView('threads')}>
                    <i className="fas fa-arrow-left"></i> Back to Threads
                  </button>
                  <h1 className="detail-title">{selectedThread.title}</h1>
                </div>

                <div className="detail-content">
                  <div className="thread-post">
                    <div className="post-header">
                      <div className="post-avatar">
                        {selectedThread.authorPhoto ? (
                          <img src={selectedThread.authorPhoto} alt="Profile" />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div className="post-info">
                        <h3 className="post-author">{selectedThread.authorName}</h3>
                        <span className="post-time">{formatTime(selectedThread.createdAt)}</span>
                      </div>
                    </div>
                    <div className="post-content">
                      <p>{selectedThread.content}</p>
                    </div>
                    <div className="post-actions">
                      <button 
                        className="action-btn like-btn"
                        onClick={() => handleReaction(selectedThread.id, 'like')}
                      >
                        <i className="far fa-thumbs-up"></i>
                        <span>{selectedThread.likes || 0}</span>
                      </button>
                      <button 
                        className="action-btn comment-btn"
                        onClick={() => handlePostAction(selectedThread.id, 'comment')}
                      >
                        <i className="far fa-comment"></i>
                        <span>Comment</span>
                      </button>
                      <button 
                        className="action-btn share-btn"
                        onClick={() => handlePostAction(selectedThread.id, 'share')}
                      >
                        <i className="fas fa-share"></i>
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="comments-section">
                    <h3 className="comments-title">Comments ({selectedThread.replyCount || 0})</h3>
                    
                    {/* Comment Form */}
                    <form className="reply-form" onSubmit={handleReplySubmit}>
                      <div className="reply-input">
                        <textarea
                          id="reply-content"
                          name="content"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a comment..."
                          required
                        ></textarea>
                      </div>
                      <button type="submit" className="btn btn-primary">Post Comment</button>
                    </form>

                    {/* Comments List */}
                    <div className="comments-list">
                      {comments.map(comment => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-avatar">
                            {comment.authorPhoto ? (
                              <img src={comment.authorPhoto} alt="Profile" />
                            ) : (
                              <i className="fas fa-user"></i>
                            )}
                          </div>
                          <div className="comment-content">
                            <div className="comment-header">
                              <h4 className="comment-author">{comment.authorName}</h4>
                              <span className="comment-time">{formatTime(comment.createdAt)}</span>
                            </div>
                            <p className="comment-text">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Thread</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateThreadSubmit}>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={createThreadData.category}
                  onChange={handleCreateThreadInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={createThreadData.title}
                  onChange={handleCreateThreadInputChange}
                  placeholder="Enter thread title..."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  name="content"
                  value={createThreadData.content}
                  onChange={handleCreateThreadInputChange}
                  placeholder="Write your post..."
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary">Create Thread</button>
            </form>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePostModal(false)}>
          <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-post-header">
              <h2>Create post</h2>
              <button className="close-btn" onClick={() => setShowCreatePostModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="create-post-user-info">
              <div className="create-post-avatar">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="create-post-profile-image"
                  />
                ) : currentUser?.profilePictureBase64 ? (
                  <img 
                    src={currentUser.profilePictureBase64} 
                    alt="Profile" 
                    className="create-post-profile-image"
                  />
                ) : (
                  <div className="create-post-profile-initial">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="create-post-user-details">
                <div className="create-post-user-name">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </div>
                <button className="privacy-selector">
                  <i className="fas fa-globe"></i>
                  <span>Public</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
            </div>

            <div className="create-post-content">
              <textarea
                className="create-post-textarea"
                placeholder="What's on your mind?"
                value={createPostData.content}
                onChange={(e) => setCreatePostData({...createPostData, content: e.target.value})}
                rows="4"
              />
              <div className="text-formatting">
                <button className="format-btn">
                  <i className="fas fa-bold">A</i>
                </button>
                <button className="format-btn">
                  <i className="fas fa-smile"></i>
                </button>
              </div>
            </div>

            <div className="add-to-post">
              <span className="add-to-post-label">Add to your post</span>
              <div className="add-options">
                <button className="add-option-btn">
                  <i className="fas fa-images"></i>
                </button>
                <button className="add-option-btn">
                  <i className="fas fa-user-tag"></i>
                </button>
                <button className="add-option-btn">
                  <i className="fas fa-smile"></i>
                </button>
                <button className="add-option-btn">
                  <i className="fas fa-map-marker-alt"></i>
                </button>
                <button className="add-option-btn">
                  <i className="fas fa-poll"></i>
                </button>
                <button className="add-option-btn">
                  <i className="fas fa-ellipsis-h"></i>
                </button>
              </div>
            </div>

            <div className="create-post-actions">
              <button 
                className="post-btn"
                onClick={handleCreatePostSubmit}
                disabled={!createPostData.content.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Choice Modal */}
      {showCreateChoiceModal && (
        <div className="modal-overlay" onClick={() => setShowCreateChoiceModal(false)}>
          <div className="create-choice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-choice-header">
              <h2>What would you like to create?</h2>
              <button className="close-btn" onClick={() => setShowCreateChoiceModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="create-choice-options">
              <div 
                className="choice-option"
                onClick={() => {
                  setShowCreateChoiceModal(false);
                  setShowCreateModal(true);
                }}
              >
                <div className="choice-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <div className="choice-content">
                  <h3>Create Thread</h3>
                  <p>Start a discussion with a specific topic and category</p>
                </div>
                <div className="choice-arrow">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
              
              <div 
                className="choice-option"
                onClick={() => {
                  setShowCreateChoiceModal(false);
                  setShowCreatePostModal(true);
                }}
              >
                <div className="choice-icon">
                  <i className="fas fa-edit"></i>
                </div>
                <div className="choice-content">
                  <h3>Create Post</h3>
                  <p>Share a quick update or thought with the community</p>
                </div>
                <div className="choice-arrow">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Forum;