import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function Forum() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('career');
  const [activeView, setActiveView] = useState('threads'); // 'threads' or 'detail'
  const [selectedThread, setSelectedThread] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSort, setActiveSort] = useState('Latest');
  const [replyContent, setReplyContent] = useState('');
  const [createThreadData, setCreateThreadData] = useState({
    category: '',
    title: '',
    content: ''
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

  // Fetch forum posts from Firestore
  useEffect(() => {
    const fetchForumPosts = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching forum posts...');
        
        const forumRef = collection(db, 'forum-posts');
        const q = query(
          forumRef,
          where('category', '==', activeCategory),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const forumPosts = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Initialize default values
          let userReaction = null;
          let reactionCounts = {};
          let totalReactions = 0;
          
          try {
            // Fetch reactions for this post
            const reactionsRef = collection(db, 'forum-posts', doc.id, 'reactions');
            const reactionsSnapshot = await getDocs(reactionsRef);
            const reactions = {};
            
            reactionsSnapshot.docs.forEach(reactionDoc => {
              const reactionData = reactionDoc.data();
              reactions[reactionData.userId] = reactionData.type;
            });
            
            // Get user's reaction for this post
            userReaction = reactions[currentUser.uid] || null;
            
            // Count reactions by type
            Object.values(reactions).forEach(type => {
              reactionCounts[type] = (reactionCounts[type] || 0) + 1;
            });
            
            totalReactions = Object.values(reactions).length;
          } catch (error) {
            console.log('No reactions found for post:', doc.id);
            // Continue with default values
          }
          
          return {
            id: doc.id,
            title: data.title,
            author: data.authorName || 'Anonymous',
            time: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : 'Unknown time',
            replies: data.replyCount || 0,
            views: data.viewCount || 0,
            preview: data.content ? data.content.substring(0, 100) + '...' : 'No content',
            icon: data.category === 'career' ? 'C' : data.category === 'technical' ? 'T' : 'G',
            content: data.content,
            authorId: data.authorId,
            category: data.category,
            userReaction: userReaction,
            reactionCounts: reactionCounts,
            totalReactions: totalReactions
          };
        }));
        
        setThreads(forumPosts);
        console.log('Fetched forum posts:', forumPosts.length);
      } catch (error) {
        console.error('Error fetching forum posts:', error);
        setThreads([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForumPosts();
  }, [currentUser, activeCategory]);

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setActiveView('threads');
    setSelectedThread(null);
  };

  const handleThreadClick = async (thread) => {
    setSelectedThread(thread);
    setActiveView('detail');
    // Fetch comments for this thread
    await fetchComments(thread.id);
  };

  const handleBackToThreads = () => {
    setActiveView('threads');
    setSelectedThread(null);
  };

  const handleSortChange = (sortBy) => {
    setActiveSort(sortBy);
    // In a real app, this would sort the threads
    console.log(`Sorting threads by: ${sortBy}`);
  };

  const handleCreateThread = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCreateThreadData({ category: '', title: '', content: '' });
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
      setIsLoading(true);
      
      // Get user data for author info
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      const authorName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.displayName || currentUser.email?.split('@')[0] || 'Anonymous';
      
      // Create forum post in Firestore
      const forumPost = {
        title: createThreadData.title,
        content: createThreadData.content,
        category: createThreadData.category,
        authorId: currentUser.uid,
        authorName: authorName,
        authorRole: userData.role || 'student',
        replyCount: 0,
        viewCount: 0,
        likes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'forum-posts'), forumPost);
      
    alert(`Thread "${createThreadData.title}" created successfully in ${createThreadData.category} category!`);
    
    // Reset form and close modal
    setCreateThreadData({ category: '', title: '', content: '' });
    setShowCreateModal(false);
      
      // Refresh the threads list
      window.location.reload();
      
    } catch (error) {
      console.error('Error creating thread:', error);
      alert('Failed to create thread. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, where('postId', '==', postId), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !selectedThread) {
      alert('Please enter a comment');
      return;
    }

    if (!currentUser) {
      alert('Please log in to post comments');
      return;
    }

    try {
      console.log('Creating comment for post:', selectedThread.id);
      console.log('Current user:', currentUser.uid);
      
      const comment = {
        postId: selectedThread.id,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        content: replyContent,
        parentCommentId: null, // Top-level comment
        createdAt: new Date()
      };

      console.log('Comment data:', comment);
      
      // Try creating in main comments collection first
      const commentsRef = collection(db, 'comments');
      console.log('Comments collection reference:', commentsRef);
      
      const docRef = await addDoc(commentsRef, comment);
      console.log('Comment created with ID:', docRef.id);

      // Create notification for post author
      const notification = {
        recipientId: selectedThread.authorId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        type: 'forum-comment',
        title: '💬 New Comment',
        message: `${currentUser.displayName || 'Someone'} commented on your post "${selectedThread.title}"`,
        data: {
          postId: selectedThread.id,
          postTitle: selectedThread.title,
          commentContent: replyContent
        },
        read: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notification);

      alert('Comment posted successfully!');
      setReplyContent('');
      
      // Refresh comments
      await fetchComments(selectedThread.id);
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  const handleReplyToComment = async (e) => {
    e.preventDefault();
    
    if (!replyToCommentText.trim() || !showReplyToComment) {
      alert('Please enter a reply');
      return;
    }

    if (!currentUser) {
      alert('Please log in to post replies');
      return;
    }

    try {
      console.log('Creating reply to comment:', showReplyToComment.id);
      console.log('Current user:', currentUser.uid);
      
      const reply = {
        postId: selectedThread.id,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        content: replyToCommentText,
        parentCommentId: showReplyToComment.id,
        createdAt: new Date()
      };

      console.log('Reply data:', reply);
      
      // Try creating in main comments collection first
      const commentsRef = collection(db, 'comments');
      console.log('Comments collection reference:', commentsRef);
      
      const docRef = await addDoc(commentsRef, reply);
      console.log('Reply created with ID:', docRef.id);

      // Create notification for comment author
      const notification = {
        recipientId: showReplyToComment.authorId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        type: 'comment-reply',
        title: '💬 Reply to Your Comment',
        message: `${currentUser.displayName || 'Someone'} replied to your comment`,
        data: {
          postId: selectedThread.id,
          postTitle: selectedThread.title,
          commentContent: replyToCommentText,
          originalCommentId: showReplyToComment.id
        },
        read: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'notifications'), notification);

      alert('Reply posted successfully!');
      setReplyToCommentText('');
      setShowReplyToComment(null);
      
      // Refresh comments
      await fetchComments(selectedThread.id);
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply. Please try again.');
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) {
      alert('Please log in to react to posts');
      return;
    }

    try {
      const post = threads.find(p => p.id === postId);
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
      const sharedPost = {
        originalPostId: postId,
        originalAuthorId: post.authorId,
        originalTitle: post.title,
        originalContent: post.content,
        sharedBy: currentUser.uid,
        sharedByName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        category: post.category,
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
        message: `${currentUser.displayName || 'Someone'} shared your post "${post.title}"`,
        data: {
          originalPostId: postId,
          postTitle: post.title
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

  const handleNotificationClick = () => {
    alert('Notifications panel would open here');
  };

  const handleUserProfileClick = () => {
    alert('User profile menu would open here');
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
            <button className="create-thread-btn" onClick={handleCreateThread}>
              <i className="fas fa-plus"></i> Create New Thread
            </button>
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
                  <div className="threads-list">
                    {threads.map(thread => (
                      <div
                        key={thread.id}
                        className="thread-item"
                        onClick={() => handleThreadClick(thread)}
                      >
                        <div className="thread-icon">{thread.icon}</div>
                        <div className="thread-content">
                          <div className="thread-title">{thread.title}</div>
                          <div className="thread-meta">
                            <div className="thread-author">
                              <i className="fas fa-user"></i>
                              <span>{thread.author}</span>
                            </div>
                            <div className="thread-time">
                              <i className="fas fa-clock"></i>
                              <span>{thread.time}</span>
                            </div>
                            <div className="thread-stats">
                              <div className="stat-item">
                                <i className="fas fa-comment"></i>
                                <span>{thread.replies}</span>
                              </div>
                              <div className="stat-item">
                                <i className="fas fa-eye"></i>
                                <span>{thread.views}</span>
                              </div>
                              {thread.totalReactions > 0 && (
                                <div className="stat-item reactions">
                                  <span className="reaction-summary">
                                    {Object.entries(thread.reactionCounts).map(([type, count]) => {
                                      const reaction = reactionTypes.find(r => r.type === type);
                                      return reaction ? `${reaction.emoji}${count}` : '';
                                    }).join(' ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="thread-preview">{thread.preview}</div>
                        </div>
                        <div className="thread-actions" onClick={(e) => e.stopPropagation()}>
                          <div className="reaction-buttons">
                            <button 
                              className={`reaction-btn ${thread.userReaction === 'like' ? 'active' : ''}`}
                              onClick={() => handleReaction(thread.id, 'like')}
                              title="Like"
                            >
                              👍
                            </button>
                            <button 
                              className={`reaction-btn ${thread.userReaction === 'love' ? 'active' : ''}`}
                              onClick={() => handleReaction(thread.id, 'love')}
                              title="Love"
                            >
                              ❤️
                            </button>
                            <button 
                              className={`reaction-btn ${thread.userReaction === 'laugh' ? 'active' : ''}`}
                              onClick={() => handleReaction(thread.id, 'laugh')}
                              title="Haha"
                            >
                              😂
                            </button>
                            <button 
                              className={`reaction-btn ${thread.userReaction === 'wow' ? 'active' : ''}`}
                              onClick={() => handleReaction(thread.id, 'wow')}
                              title="Wow"
                            >
                              😮
                            </button>
                            <button 
                              className={`reaction-btn ${thread.userReaction === 'sad' ? 'active' : ''}`}
                              onClick={() => handleReaction(thread.id, 'sad')}
                              title="Sad"
                            >
                              😢
                            </button>
                            <button 
                              className={`reaction-btn ${thread.userReaction === 'angry' ? 'active' : ''}`}
                              onClick={() => handleReaction(thread.id, 'angry')}
                              title="Angry"
                            >
                              😡
                            </button>
                          </div>
                          <div className="action-buttons">
                            <button 
                              className="action-btn"
                              onClick={() => handlePostAction(thread.id, 'comment')}
                            >
                              <i className="far fa-comment"></i>
                              Comment
                            </button>
                            <button 
                              className="action-btn"
                              onClick={() => handlePostAction(thread.id, 'share')}
                            >
                              <i className="far fa-share"></i>
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Thread Detail View */}
            {activeView === 'detail' && selectedThread && (
              <div className="thread-detail active">
                {/* Thread Header */}
                <div className="thread-header">
                  <button className="back-btn" onClick={handleBackToThreads}>
                    <i className="fas fa-arrow-left"></i> Back to Threads
                  </button>
                  <h1 className="thread-detail-title">{selectedThread.title}</h1>
                  <div className="thread-detail-meta">
                    <div className="thread-author">
                      <i className="fas fa-user"></i>
                      <span>{selectedThread.author}</span>
                    </div>
                    <div className="thread-time">
                      <i className="fas fa-clock"></i>
                      <span>Posted {selectedThread.time}</span>
                    </div>
                    <div className="thread-stats">
                      <div className="stat-item">
                        <i className="fas fa-comment"></i>
                        <span>{selectedThread.replies} replies</span>
                      </div>
                      <div className="stat-item">
                        <i className="fas fa-eye"></i>
                        <span>{selectedThread.views} views</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Container */}
                <div className="posts-container">
                  <div className="posts-header">Comments ({comments.length})</div>
                  <div className="posts-list">
                    {comments.filter(comment => !comment.parentCommentId).map(comment => (
                      <div key={comment.id} className="post-item">
                        <div className="post-header">
                          <div className="post-avatar">{comment.authorName ? comment.authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}</div>
                          <div className="post-info">
                            <div className="post-author">{comment.authorName || 'Anonymous'}</div>
                            <div className="post-time">{comment.createdAt ? new Date(comment.createdAt.toDate()).toLocaleString() : 'Unknown time'}</div>
                          </div>
                        </div>
                        <div className="post-content">
                          {comment.content}
                        </div>
                        <div className="post-actions">
                          <div 
                            className="post-action"
                            onClick={() => setShowReplyToComment(comment)}
                          >
                            <i className="far fa-comment"></i>
                            <span>Reply</span>
                          </div>
                        </div>
                        
                        {/* Nested Replies */}
                        {comments.filter(reply => reply.parentCommentId === comment.id).map(reply => (
                          <div key={reply.id} className="post-item nested-reply">
                            <div className="post-header">
                              <div className="post-avatar">{reply.authorName ? reply.authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}</div>
                              <div className="post-info">
                                <div className="post-author">{reply.authorName || 'Anonymous'}</div>
                                <div className="post-time">{reply.createdAt ? new Date(reply.createdAt.toDate()).toLocaleString() : 'Unknown time'}</div>
                              </div>
                            </div>
                            <div className="post-content">
                              {reply.content}
                            </div>
                          </div>
                        ))}
                        
                        {/* Reply to Comment Form */}
                        {showReplyToComment && showReplyToComment.id === comment.id && (
                          <div className="reply-to-comment-form">
                            <form onSubmit={handleReplyToComment}>
                              <div className="form-group">
                                <textarea
                                  className="form-control"
                                  value={replyToCommentText}
                                  onChange={(e) => setReplyToCommentText(e.target.value)}
                                  placeholder="Write a reply..."
                                  rows="3"
                                  required
                                />
                              </div>
                              <div className="form-actions">
                                <button type="submit" className="btn btn-primary btn-sm">Post Reply</button>
                                <button 
                                  type="button" 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setShowReplyToComment(null);
                                    setReplyToCommentText('');
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {comments.length === 0 && (
                      <div className="empty-state">
                        <p>No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Form */}
                <div className="reply-form">
                  <h3 className="form-label">Post a Comment</h3>
                  <form onSubmit={handleReplySubmit}>
                    <div className="form-group">
                      <textarea
                        className="form-control"
                        id="reply-content"
                        name="replyContent"
                        placeholder="Write your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary">Post Comment</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Thread</h2>
              <div className="modal-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </div>
            </div>
            <form onSubmit={handleCreateThreadSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="thread-category">Category</label>
                <select
                  className="form-control"
                  id="thread-category"
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
                <label className="form-label" htmlFor="thread-title">Title</label>
                <input
                  type="text"
                  className="form-control"
                  id="thread-title"
                  name="title"
                  value={createThreadData.title}
                  onChange={handleCreateThreadInputChange}
                  placeholder="Enter a title for your thread"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="thread-content">Content</label>
                <textarea
                  className="form-control"
                  id="thread-content"
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
    </>
  );
}

export default Forum;
