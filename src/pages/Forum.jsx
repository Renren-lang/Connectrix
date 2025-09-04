import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, getDoc } from 'firebase/firestore';
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
        const forumPosts = querySnapshot.docs.map(doc => {
          const data = doc.data();
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
            category: data.category
          };
        });
        
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

  const handleThreadClick = (thread) => {
    setSelectedThread(thread);
    setActiveView('detail');
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

  const handleReplySubmit = (e) => {
    e.preventDefault();
    
    if (replyContent.trim()) {
      // In a real app, this would add the reply to the database
      alert('Reply posted successfully!');
      setReplyContent('');
    }
  };

  const handlePostAction = (postId, action) => {
    if (action === 'like') {
      // In a real app, this would update the like count in the database
      console.log(`Toggling like for post ${postId}`);
    } else if (action === 'reply') {
      // Scroll to reply form
      const replyForm = document.querySelector('.reply-form');
      if (replyForm) {
        replyForm.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('reply-content')?.focus();
      }
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
      <div className="container">
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
                            </div>
                          </div>
                          <div className="thread-preview">{thread.preview}</div>
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

                {/* Posts Container */}
                <div className="posts-container">
                  <div className="posts-header">Discussion</div>
                  <div className="posts-list">
                    {posts.map(post => (
                      <div key={post.id} className="post-item">
                        <div className="post-header">
                          <div className="post-avatar">{post.avatar}</div>
                          <div className="post-info">
                            <div className="post-author">{post.author}</div>
                            <div className="post-time">{post.time}</div>
                          </div>
                        </div>
                        <div className="post-content">
                          {post.content.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              {index < post.content.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="post-actions">
                          <div 
                            className={`post-action ${post.isLiked ? 'liked' : ''}`}
                            onClick={() => handlePostAction(post.id, 'like')}
                          >
                            <i className={post.isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
                            <span>{post.likes}</span>
                          </div>
                          <div 
                            className="post-action"
                            onClick={() => handlePostAction(post.id, 'reply')}
                          >
                            <i className="far fa-comment"></i>
                            <span>Reply</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply Form */}
                <div className="reply-form">
                  <h3 className="form-label">Post a Reply</h3>
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
                    <button type="submit" className="btn btn-primary">Post Reply</button>
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
