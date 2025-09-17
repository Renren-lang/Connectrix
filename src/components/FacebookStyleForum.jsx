import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './FacebookStyleForum.css';

function FacebookStyleForum() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [privacy, setPrivacy] = useState('Public');
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [userReactions, setUserReactions] = useState({});
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState({});

  // Facebook-like reaction types
  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'angry', emoji: '😡', label: 'Angry' }
  ];

  // Fetch posts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'forum-posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !currentUser) return;

    try {
      const postData = {
        content: postContent.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}` || 'User',
        authorPhoto: currentUser.photoURL || currentUser.profilePictureBase64 || null,
        privacy: privacy,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'forum-posts'), postData);
      setPostContent('');
      setShowCreatePost(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) return;

    try {
      const reactionRef = doc(db, `forum-posts/${postId}/reactions`, `${currentUser.uid}_${reactionType}`);
      
      // Check if user already reacted with this type
      const existingReaction = userReactions[postId]?.[reactionType];
      
      if (existingReaction) {
        // Remove reaction
        await deleteDoc(reactionRef);
      } else {
        // Add reaction
        await addDoc(collection(db, `forum-posts/${postId}/reactions`), {
          userId: currentUser.uid,
          reactionType,
          createdAt: serverTimestamp()
        });
      }

      // Refresh reactions
      fetchPostReactions(postId);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const fetchPostReactions = async (postId) => {
    try {
      const reactionsRef = collection(db, `forum-posts/${postId}/reactions`);
      const querySnapshot = await getDocs(reactionsRef);
      const reactions = {};
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        reactions[data.reactionType] = (reactions[data.reactionType] || 0) + 1;
      });
      
      setUserReactions(prev => ({
        ...prev,
        [postId]: reactions
      }));
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleComment = async (postId) => {
    if (!commentText[postId]?.trim() || !currentUser) return;

    try {
      const commentData = {
        postId,
        content: commentText[postId].trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}` || 'User',
        authorPhoto: currentUser.photoURL || currentUser.profilePictureBase64 || null,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'post-comments'), commentData);
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      fetchComments(postId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const commentsRef = collection(db, 'post-comments');
      const q = query(commentsRef, where('postId', '==', postId), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setComments(prev => ({
        ...prev,
        [postId]: commentsData
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
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

  const getTotalReactions = (postId) => {
    const reactions = userReactions[postId] || {};
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

  const getTopReaction = (postId) => {
    const reactions = userReactions[postId] || {};
    let maxCount = 0;
    let topReaction = 'like';
    
    Object.entries(reactions).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topReaction = type;
      }
    });
    
    return { type: topReaction, count: maxCount };
  };

  if (isLoading) {
    return (
      <div className="facebook-forum">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="facebook-forum">
      {/* Create Post Card */}
      <div className="create-post-card">
        <div className="create-post-header">
          <div className="user-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" />
            ) : currentUser?.profilePictureBase64 ? (
              <img src={currentUser.profilePictureBase64} alt="Profile" />
            ) : (
              <div className="avatar-initial">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div 
            className="post-input"
            onClick={() => setShowCreatePost(true)}
          >
            What's on your mind, {currentUser?.displayName?.split(' ')[0] || 'User'}?
          </div>
        </div>
        
        <div className="create-post-options">
          <button className="option-btn live-video">
            <i className="fas fa-video"></i>
            <span>Live video</span>
          </button>
          <button className="option-btn photo-video">
            <i className="fas fa-images"></i>
            <span>Photo/video</span>
          </button>
          <button className="option-btn feeling">
            <i className="far fa-smile"></i>
            <span>Feeling/activity</span>
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      {posts.map(post => (
        <div key={post.id} className="post-card">
          <div className="post-header">
            <div className="post-author">
              <div className="author-avatar">
                {post.authorPhoto ? (
                  <img src={post.authorPhoto} alt="Profile" />
                ) : (
                  <div className="avatar-initial">
                    {post.authorName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="author-info">
                <h4 className="author-name">{post.authorName}</h4>
                <div className="post-meta">
                  <span className="post-time">{formatTime(post.createdAt)}</span>
                  <span className="privacy-icon">
                    <i className="fas fa-globe"></i>
                  </span>
                </div>
              </div>
            </div>
            <div className="post-actions">
              <button className="action-btn">
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </div>
          </div>

          <div className="post-content">
            <p>{post.content}</p>
          </div>

          <div className="post-stats">
            <div className="reactions-count">
              {getTotalReactions(post.id) > 0 && (
                <>
                  <span className="reaction-emoji">
                    {reactionTypes.find(r => r.type === getTopReaction(post.id).type)?.emoji}
                  </span>
                  <span className="reaction-count">{getTotalReactions(post.id)}</span>
                </>
              )}
            </div>
            <div className="comments-shares">
              <span>{comments[post.id]?.length || 0} comments</span>
              <span>{post.shares || 0} shares</span>
            </div>
          </div>

          <div className="post-actions-bar">
            <button 
              className="action-button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowReactionPicker(post.id);
              }}
              onMouseLeave={() => setShowReactionPicker(null)}
            >
              <i className="far fa-thumbs-up"></i>
              <span>Like</span>
            </button>
            <button 
              className="action-button"
              onClick={() => {
                setShowComments(prev => ({
                  ...prev,
                  [post.id]: !prev[post.id]
                }));
                if (!comments[post.id]) {
                  fetchComments(post.id);
                }
              }}
            >
              <i className="far fa-comment"></i>
              <span>Comment</span>
            </button>
            <button className="action-button">
              <i className="fas fa-share"></i>
              <span>Share</span>
            </button>
          </div>

          {/* Reaction Picker */}
          {showReactionPicker === post.id && (
            <div className="reaction-picker">
              {reactionTypes.map(reaction => (
                <button
                  key={reaction.type}
                  className="reaction-btn"
                  onClick={() => {
                    handleReaction(post.id, reaction.type);
                    setShowReactionPicker(null);
                  }}
                >
                  <span className="reaction-emoji">{reaction.emoji}</span>
                </button>
              ))}
            </div>
          )}

          {/* Comments Section */}
          {showComments[post.id] && (
            <div className="comments-section">
              <div className="comment-input">
                <div className="comment-avatar">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" />
                  ) : currentUser?.profilePictureBase64 ? (
                    <img src={currentUser.profilePictureBase64} alt="Profile" />
                  ) : (
                    <div className="avatar-initial">
                      {currentUser?.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="comment-input-field">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText[post.id] || ''}
                    onChange={(e) => setCommentText(prev => ({
                      ...prev,
                      [post.id]: e.target.value
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleComment(post.id);
                      }
                    }}
                  />
                </div>
              </div>
              
              {comments[post.id]?.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-avatar">
                    {comment.authorPhoto ? (
                      <img src={comment.authorPhoto} alt="Profile" />
                    ) : (
                      <div className="avatar-initial">
                        {comment.authorName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.authorName}</span>
                      <span className="comment-time">{formatTime(comment.createdAt)}</span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="create-post-modal-overlay" onClick={() => setShowCreatePost(false)}>
          <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create post</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreatePost(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-user-info">
              <div className="user-avatar">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" />
                ) : currentUser?.profilePictureBase64 ? (
                  <img src={currentUser.profilePictureBase64} alt="Profile" />
                ) : (
                  <div className="avatar-initial">
                    {currentUser?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h4>{currentUser?.displayName || 'User'}</h4>
                <div className="privacy-selector">
                  <i className="fas fa-globe"></i>
                  <span>{privacy}</span>
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>

            <div className="modal-content">
              <textarea
                placeholder="What's on your mind, {currentUser?.displayName?.split(' ')[0] || 'User'}?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="post-textarea"
              />
            </div>

            <div className="modal-options">
              <div className="add-to-post">
                <span>Add to your post</span>
                <div className="option-icons">
                  <button className="option-icon photo">
                    <i className="fas fa-images"></i>
                  </button>
                  <button className="option-icon tag">
                    <i className="fas fa-user-tag"></i>
                  </button>
                  <button className="option-icon feeling">
                    <i className="far fa-smile"></i>
                  </button>
                  <button className="option-icon location">
                    <i className="fas fa-map-marker-alt"></i>
                  </button>
                  <button className="option-icon more">
                    <i className="fas fa-ellipsis-h"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="post-btn"
                onClick={handleCreatePost}
                disabled={!postContent.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacebookStyleForum;
