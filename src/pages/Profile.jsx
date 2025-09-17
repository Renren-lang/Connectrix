import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, limit, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { sanitizeFirestoreData, safeFirestoreOperation, validateUserInput } from '../utils/firestoreHelpers';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUploadType, setImageUploadType] = useState('profilePictures');
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutData, setAboutData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    bio: ''
  });
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [commentingPost, setCommentingPost] = useState(null);
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const postImageRef = useRef(null);

  useEffect(() => {
    fetchUserData();
    fetchPosts();
    
    let isMounted = true;
    let unsubscribe = null;

    const setupPostsListener = () => {
      try {
        // Set up real-time listener for posts
        const postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      
        unsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
          if (!isMounted) return;
          
          try {
            const postsData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setPosts(postsData);
          } catch (error) {
            console.error('Error processing posts data:', error);
          }
        }, (error) => {
          console.error('Error listening to posts:', error);
        });
      } catch (error) {
        console.error('Error setting up posts listener:', error);
      }
    };

    setupPostsListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from posts listener:', error);
        }
      }
    };
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setBioText(data.bio || '');
        setDisplayName(data.displayName || data.name || '');
        setAboutData({
          jobTitle: data.jobTitle || '',
          company: data.company || '',
          location: data.location || '',
          bio: data.bio || ''
        });
        } else {
        setUserData(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    
  const fetchPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(postsQuery);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  };

  const saveAboutInfo = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        jobTitle: aboutData.jobTitle,
        company: aboutData.company,
        location: aboutData.location,
        bio: aboutData.bio
      });
      setEditingAbout(false);
      // Refresh user data
      fetchUserData();
    } catch (error) {
      console.error('Error saving about info:', error);
    }
  };

  const saveDisplayName = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        displayName: displayName
      });
      setEditingName(false);
      // Refresh user data
      fetchUserData();
    } catch (error) {
      console.error('Error saving display name:', error);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      const imageRef = ref(storage, `${type}/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      await updateDoc(doc(db, 'users', userId), {
        [type === 'profilePictures' ? 'profilePicture' : 'coverPhoto']: downloadURL
      });
      
      setUserData(prev => ({
        ...prev,
        [type === 'profilePictures' ? 'profilePicture' : 'coverPhoto']: downloadURL
      }));
      
      setShowImageUploadModal(false);
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.code === 'storage/retry-limit-exceeded') {
        alert('Upload failed. Please try again with a smaller file or check your internet connection.');
      } else {
        alert('Error uploading image. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !postImage) return;
    
    try {
      // Validate input
      const postSchema = {
        content: { type: 'string', maxLength: 2000, required: true }
      };
      
      const validatedData = validateUserInput({ content: newPost }, postSchema);
      
      let imageUrl = null;
      
      // Upload image if present
      if (postImage) {
        // Validate image file
        if (postImage.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error('Image file is too large. Please choose a file smaller than 5MB.');
        }
        
        const imageRef = ref(storage, `postImages/${userId}/${Date.now()}_${postImage.name}`);
        await uploadBytes(imageRef, postImage);
        imageUrl = await getDownloadURL(imageRef);
      }
      
      // Sanitize post data
      const postData = sanitizeFirestoreData({
        content: validatedData.content,
        imageUrl: imageUrl,
        userId: userId,
        authorName: userData?.displayName || userData?.name || 'Unknown User',
        authorEmail: userData?.email || '',
        createdAt: new Date(),
        likes: 0,
        comments: 0,
        shares: 0,
        likedBy: [],
        commentsList: []
      });
      
      await safeFirestoreOperation(
        () => addDoc(collection(db, 'posts'), postData),
        'create post'
      );
      
      setNewPost('');
      setPostImage(null);
      setPostImagePreview(null);
      setShowCreatePost(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Failed to create post: ${error.message}`);
    }
  };

  const handleUpdateBio = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        bio: bioText
      });
      setUserData(prev => ({ ...prev, bio: bioText }));
      setEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        fetchPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post.id);
    setEditPostContent(post.content);
  };

  const handleUpdatePost = async () => {
    if (!editPostContent.trim()) return;
    
    try {
      await updateDoc(doc(db, 'posts', editingPost), {
        content: editPostContent
      });
      setEditingPost(null);
      setEditPostContent('');
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleLikePost = async (postId, currentLikes, likedBy) => {
    try {
      const isLiked = likedBy.includes(userId);
      const newLikedBy = isLiked 
        ? likedBy.filter(id => id !== userId)
        : [...likedBy, userId];
      
      await updateDoc(doc(db, 'posts', postId), {
        likes: isLiked ? currentLikes - 1 : currentLikes + 1,
        likedBy: newLikedBy
      });
      fetchPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;
    
    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      const currentComments = postDoc.data().commentsList || [];
      
      const newCommentData = {
        id: Date.now().toString(),
        content: newComment,
        authorName: userData?.displayName || userData?.name || 'Unknown User',
        authorId: userId,
        createdAt: new Date()
      };
      
      await updateDoc(postRef, {
        comments: currentComments.length + 1,
        commentsList: [...currentComments, newCommentData]
      });
      
      setNewComment('');
      setCommentingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSharePost = async (post) => {
    try {
      await addDoc(collection(db, 'posts'), {
        content: `Shared: ${post.content}`,
        originalPostId: post.id,
        imageUrl: post.imageUrl,
        userId: userId,
        authorName: userData?.displayName || userData?.name || 'Unknown User',
        authorEmail: userData?.email || '',
        createdAt: new Date(),
        likes: 0,
        comments: 0,
        shares: 0,
        likedBy: [],
        commentsList: []
      });
      
      // Update original post share count
      await updateDoc(doc(db, 'posts', post.id), {
        shares: post.shares + 1
      });
      
      fetchPosts();
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handlePostImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPostImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="facebook-profile-page">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="facebook-profile-page">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="facebook-profile-page">
      {/* Cover Photo Section */}
      <div className="cover-photo-section">
        <div className="cover-photo">
          {userData.coverPhoto ? (
            <img src={userData.coverPhoto} alt="Cover" className="cover-photo-image" />
          ) : (
            <div className="cover-photo-placeholder">
              <i className="fas fa-camera"></i>
              <span>Add Cover Photo</span>
            </div>
          )}
          <button 
            className="edit-cover-btn"
            onClick={() => {
              setShowImageUploadModal(true);
              setImageUploadType('coverPhotos');
            }}
          >
            <i className="fas fa-camera"></i>
            Edit cover photo
          </button>
        </div>
      </div>
        
      {/* Profile Info Section */}
      <div className="profile-info-section">
        <div className="profile-info-container">
          <div className="profile-picture-container">
            <div className="profile-picture-large">
              {userData.profilePicture ? (
                <img src={userData.profilePicture} alt="Profile" />
              ) : (
                <div className="profile-picture-placeholder">
                  {(userData.displayName || userData.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {isUploading && (
                <div className="uploading-spinner">
                  <div className="spinner"></div>
                  <span>Uploading...</span>
            </div>
              )}
            <button 
              className="edit-profile-picture-btn"
                onClick={() => {
                  setShowImageUploadModal(true);
                  setImageUploadType('profilePictures');
                }}
            >
              <i className="fas fa-camera"></i>
            </button>
            </div>
          </div>
          
          <div className="profile-details">
            {editingName ? (
              <div className="name-edit-container">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="name-input"
                  placeholder="Enter your name"
                />
                <div className="name-edit-buttons">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={saveDisplayName}
                  >
                    Save
                  </button>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setEditingName(false);
                      setDisplayName(userData.displayName || userData.name || '');
                    }}
                  >
                    Cancel
                  </button>
            </div>
              </div>
            ) : (
              <div className="name-display-container">
                <h1 className="profile-name">{userData.displayName || userData.name || 'Unknown User'}</h1>
                <button 
                  className="edit-name-btn"
                  onClick={() => setEditingName(true)}
                >
              <i className="fas fa-edit"></i>
                </button>
              </div>
            )}
            <p className="profile-subtitle">{userData.role || 'Student'} • {userData.course || 'Information Technology'}</p>
            
            <div className="profile-stats">
              <div className="stat">
                <div className="stat-number">0</div>
                <div className="stat-label">connections</div>
              </div>
              <div className="stat">
                <div className="stat-number">{posts.length}</div>
                <div className="stat-label">posts</div>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn btn-primary">
                <i className="fas fa-user-plus"></i>
              Edit Profile
            </button>
              <button className="btn btn-outline">
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button 
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button 
            className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
          <button 
            className={`tab ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            Photos
          </button>
          <button 
            className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            Videos
          </button>
          <button className="tab">
            More <i className="fas fa-chevron-down"></i>
          </button>
        </div>
        <div className="tab-actions">
          <button className="tab-action-btn">
            <i className="fas fa-ellipsis-h"></i>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-main-content">
        <div className="content-container">
          {/* Left Content - About Section */}
          <div className="left-content">
            <div className="about-card">
              <div className="about-header">
                <h3 className="about-title">About</h3>
                {userData?.role === 'Mentor' && (
                  <button 
                    className="edit-about-btn"
                    onClick={() => setEditingAbout(!editingAbout)}
                  >
                    <i className="fas fa-edit"></i>
                    {editingAbout ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>
              <div className="intro-content">
                {/* Basic Information */}
                <div className="intro-item">
                  <i className="fas fa-user"></i>
                  <div>
                    <div className="intro-text">Name</div>
                    <p className="intro-value">{userData?.displayName || userData?.name || 'Not provided'}</p>
                  </div>
                </div>

                <div className="intro-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <div className="intro-text">Email</div>
                    <p className="intro-value">{userData?.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="intro-item">
                  <i className="fas fa-graduation-cap"></i>
                  <div>
                    <div className="intro-text">Role</div>
                    <p className="intro-value">{userData?.role || 'Not provided'}</p>
                  </div>
                </div>

                {userData?.course && (
                  <div className="intro-item">
                    <i className="fas fa-book"></i>
                    <div>
                      <div className="intro-text">Course</div>
                      <p className="intro-value">{userData.course}</p>
                    </div>
                  </div>
                )}

                {userData?.batch && (
                  <div className="intro-item">
                    <i className="fas fa-calendar"></i>
                    <div>
                      <div className="intro-text">Batch</div>
                      <p className="intro-value">{userData.batch}</p>
                    </div>
                  </div>
                )}

                {/* Mentor-specific information */}
                {userData?.role === 'Mentor' && (
                  <>
                    <div className="intro-item">
                      <i className="fas fa-briefcase"></i>
                      <div>
                        <div className="intro-text">Job Title</div>
                        {editingAbout ? (
                          <input
                            type="text"
                            value={aboutData.jobTitle}
                            onChange={(e) => setAboutData({...aboutData, jobTitle: e.target.value})}
                            className="form-control"
                            placeholder="Enter your job title"
                          />
                        ) : (
                          <p className="intro-value">{aboutData.jobTitle || 'Not provided'}</p>
                        )}
                      </div>
                    </div>

                    <div className="intro-item">
                      <i className="fas fa-building"></i>
                      <div>
                        <div className="intro-text">Company</div>
                        {editingAbout ? (
                          <input
                            type="text"
                            value={aboutData.company}
                            onChange={(e) => setAboutData({...aboutData, company: e.target.value})}
                            className="form-control"
                            placeholder="Enter your company"
                          />
                        ) : (
                          <p className="intro-value">{aboutData.company || 'Not provided'}</p>
                        )}
                      </div>
                    </div>

                    <div className="intro-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <div>
                        <div className="intro-text">Location</div>
                        {editingAbout ? (
                          <input
                            type="text"
                            value={aboutData.location}
                            onChange={(e) => setAboutData({...aboutData, location: e.target.value})}
                            className="form-control"
                            placeholder="Enter your location"
                          />
                        ) : (
                          <p className="intro-value">{aboutData.location || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Bio section */}
                <div className="intro-item bio">
                  <i className="fas fa-info-circle"></i>
                  <div>
                    <div className="intro-text">Bio</div>
                    {editingAbout ? (
                      <div>
                        <textarea
                          id="bio-textarea"
                          name="bio"
                          value={aboutData.bio}
                          onChange={(e) => setAboutData({...aboutData, bio: e.target.value})}
                          className="form-control"
                          rows="3"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    ) : (
                      <p className="bio-text">
                        {aboutData.bio || 'No bio provided'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Save button for mentors */}
                {editingAbout && userData?.role === 'Mentor' && (
                  <div className="btn-group">
                    <button 
                      className="btn btn-outline"
                      onClick={() => setEditingAbout(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={saveAboutInfo}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Posts Section */}
          <div className="right-content">
            {/* What's on your mind Card */}
            <div className="whats-on-mind-card">
              <div className="post-creation-header">
                <div className="post-author">
                  <div className="post-avatar">
                    {userData.profilePicture ? (
                      <img src={userData.profilePicture} alt="Profile" />
                    ) : (
                      <div className="post-initials">
                        {(userData.displayName || userData.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="post-input">
                    <input 
                      type="text" 
                      className="post-text-input"
                      placeholder="What's on your mind?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      onClick={() => setShowCreatePost(true)}
                    />
                  </div>
                </div>
              </div>
              <div className="post-creation-options">
                <button className="post-option live-video">
                  <i className="fas fa-video"></i>
                  Live video
                </button>
                <button className="post-option photo-video">
                  <i className="fas fa-images"></i>
                  Photo/video
                </button>
                <button className="post-option feeling">
                  <i className="fas fa-smile"></i>
                  Feeling/activity
                </button>
              </div>
            </div>

            {/* Posts List */}
            <div className="posts-section">
              <div className="posts-header">
                <h3 className="posts-title">Posts</h3>
                <div className="posts-actions">
                  <button className="posts-action-btn">
                    <i className="fas fa-filter"></i>
                    Manage posts
                  </button>
                </div>
              </div>

              <div className="view-toggles">
                <button className="view-toggle active">
                  <i className="fas fa-list"></i>
                  List view
                </button>
                <button className="view-toggle">
                  <i className="fas fa-th"></i>
                  Grid view
                </button>
              </div>

              <div className="posts-list">
                {posts.length === 0 ? (
                  <div className="no-posts">
                    <p>No posts yet</p>
                  </div>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="post-item">
                      <div className="post-header">
                        <div className="post-author-info">
                          <div className="post-author-avatar">
                            {userData.profilePicture ? (
                              <img src={userData.profilePicture} alt="Profile" />
                            ) : (
                              <div className="post-author-initials">
                                {(userData.displayName || userData.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="post-author-details">
                            <h4 className="post-author-name">
                              {post.authorName || userData.displayName || userData.name}
                            </h4>
                            <div className="post-meta">
                              <span>{new Date(post.createdAt?.toDate()).toLocaleDateString()}</span>
                              <i className="fas fa-globe-americas"></i>
                            </div>
                          </div>
                        </div>
                        <button className="post-options-btn">
                          <i className="fas fa-ellipsis-h"></i>
                        </button>
                      </div>
                      <div className="post-content">
                        {editingPost === post.id ? (
                          <div className="edit-post-form">
                            <textarea
                              id={`edit-post-${post.id}`}
                              name={`editPost-${post.id}`}
                              value={editPostContent}
                              onChange={(e) => setEditPostContent(e.target.value)}
                              className="edit-post-textarea"
                            />
                            <div className="edit-post-actions">
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={handleUpdatePost}
                              >
                                Save
                              </button>
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setEditingPost(null);
                                  setEditPostContent('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p>{post.content}</p>
                        )}
                        
                        {/* Post Image */}
                        {post.imageUrl && (
                          <div className="post-image">
                            <img src={post.imageUrl} alt="Post" />
                          </div>
                        )}
                      </div>
                      
                      {/* Comments Section */}
                      {showComments[post.id] && (
                        <div className="comments-section">
                          <div className="comments-list">
                            {post.commentsList?.map(comment => (
                              <div key={comment.id} className="comment-item">
                                <div className="comment-author">
                                  <strong>{comment.authorName}</strong>
                                  <span className="comment-time">
                                    {new Date(comment.createdAt?.toDate()).toLocaleString()}
                                  </span>
                                </div>
                                <div className="comment-content">
                                  {comment.content}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Add Comment Form */}
                          <div className="add-comment-form">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={commentingPost === post.id ? newComment : ''}
                              onChange={(e) => setNewComment(e.target.value)}
                              onFocus={() => setCommentingPost(post.id)}
                            />
                            {commentingPost === post.id && (
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAddComment(post.id)}
                                disabled={!newComment.trim()}
                              >
                                Post
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="post-actions">
                        <button 
                          className={`post-action ${post.likedBy?.includes(userId) ? 'liked' : ''}`}
                          onClick={() => handleLikePost(post.id, post.likes, post.likedBy || [])}
                        >
                          <i className="fas fa-thumbs-up"></i>
                          {post.likes || 0} Like{post.likes !== 1 ? 's' : ''}
                        </button>
                        <button 
                          className="post-action"
                          onClick={() => setShowComments({
                            ...showComments,
                            [post.id]: !showComments[post.id]
                          })}
                        >
                          <i className="fas fa-comment"></i>
                          {post.comments || 0} Comment{post.comments !== 1 ? 's' : ''}
                        </button>
                        <button 
                          className="post-action"
                          onClick={() => handleSharePost(post)}
                        >
                          <i className="fas fa-share"></i>
                          {post.shares || 0} Share{post.shares !== 1 ? 's' : ''}
                        </button>
                        <button 
                          className="post-action"
                          onClick={() => handleEditPost(post)}
                        >
                          <i className="fas fa-edit"></i>
                          Edit
                        </button>
                        <button 
                          className="post-action delete"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <i className="fas fa-trash"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="modal-overlay" onClick={() => setShowCreatePost(false)}>
          <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Post</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreatePost(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="post-author">
                <div className="post-author-avatar">
                  {userData.profilePicture ? (
                    <img src={userData.profilePicture} alt="Profile" />
                  ) : (
                    <div className="avatar-initials">
                      {(userData.displayName || userData.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="author-info">
                  <div className="author-name">
                    {userData.displayName || userData.name || 'Unknown User'}
                  </div>
                  <div className="privacy-selector">
                    <select>
                      <option>Public</option>
                      <option>Friends</option>
                      <option>Only me</option>
                    </select>
                  </div>
                </div>
              </div>
              <textarea
                id="new-post-textarea"
                name="newPost"
                className="create-post-textarea"
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              
              {/* Image Preview */}
              {postImagePreview && (
                <div className="post-image-preview">
                  <img src={postImagePreview} alt="Preview" />
                  <button 
                    className="remove-image-btn"
                    onClick={() => {
                      setPostImage(null);
                      setPostImagePreview(null);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
              
              {/* Image Upload Button */}
              <div className="post-image-upload">
                <button 
                  className="image-upload-btn"
                  onClick={() => postImageRef.current?.click()}
                >
                  <i className="fas fa-image"></i>
                  Add Photo/Video
                </button>
                <input
                  ref={postImageRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePostImageChange}
                />
              </div>
              
              <div className="category-selection">
                <h4>Select Category</h4>
                <div className="category-options">
                  <div className="category-option" style={{'--category-color': '#1877f2'}}>
                    <i className="fas fa-graduation-cap"></i>
                    <span>Academic</span>
                  </div>
                  <div className="category-option" style={{'--category-color': '#42b883'}}>
                    <i className="fas fa-briefcase"></i>
                    <span>Career</span>
                  </div>
                  <div className="category-option" style={{'--category-color': '#f02849'}}>
                    <i className="fas fa-heart"></i>
                    <span>Personal</span>
                  </div>
                  <div className="category-option" style={{'--category-color': '#ffbb33'}}>
                    <i className="fas fa-lightbulb"></i>
                    <span>Ideas</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowCreatePost(false);
                  setNewPost('');
                  setPostImage(null);
                  setPostImagePreview(null);
                }}
              >
                Cancel
              </button>
              <button 
                className={`post-btn ${(newPost.trim() || postImage) ? 'active' : 'disabled'}`}
                onClick={handleCreatePost}
                disabled={!newPost.trim() && !postImage}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageUploadModal && (
        <div className="modal-overlay" onClick={() => setShowImageUploadModal(false)}>
          <div className="image-upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload {imageUploadType === 'profilePictures' ? 'Profile Picture' : 'Cover Photo'}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowImageUploadModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="upload-options-container">
                <div className="upload-type-selector">
                  <div 
                    className={`upload-type-option ${imageUploadType === 'profilePictures' ? 'selected' : ''}`}
                    onClick={() => setImageUploadType('profilePictures')}
                  >
                    <div className="upload-type-icon profile-icon">
                      <i className="fas fa-user"></i>
                    </div>
                    <span>Profile Picture</span>
                  </div>
                  <div 
                    className={`upload-type-option ${imageUploadType === 'coverPhotos' ? 'selected' : ''}`}
                    onClick={() => setImageUploadType('coverPhotos')}
                  >
                    <div className="upload-type-icon cover-icon">
                      <i className="fas fa-mountain"></i>
                    </div>
                    <span>Cover Photo</span>
                  </div>
                </div>
                
                <div className="upload-section">
                  <button 
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fas fa-upload"></i>
                    Select Image
                  </button>
                  <div className="upload-info">
                    <p>Choose a {imageUploadType === 'profilePictures' ? 'profile picture' : 'cover photo'}</p>
                    <p>JPG, PNG or GIF. Max size 5MB</p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(file, imageUploadType);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
