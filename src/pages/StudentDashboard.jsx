import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, orderBy, doc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

function StudentDashboard() {
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
        userId: currentUser.uid, // Use current user's ID for home page posts
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        authorPhoto: currentUser.photoURL || null,
        authorRole: 'student',
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

  // Post categories for students and mentors
  const postCategories = [
    { id: 'general', name: 'General', icon: 'fas fa-comments', color: '#6c757d' },
    { id: 'career', name: 'Career Advice', icon: 'fas fa-briefcase', color: '#007bff' },
    { id: 'technical', name: 'Technical Help', icon: 'fas fa-code', color: '#28a745' },
    { id: 'events', name: 'Events & Opportunities', icon: 'fas fa-calendar', color: '#fd7e14' },
    { id: 'study', name: 'Study Tips', icon: 'fas fa-book', color: '#6f42c1' },
    { id: 'mentorship', name: 'Mentorship', icon: 'fas fa-user-graduate', color: '#20c997' },
    { id: 'resources', name: 'Resources & Materials', icon: 'fas fa-file-alt', color: '#17a2b8' },
    { id: 'concerns', name: 'Student Concerns', icon: 'fas fa-question-circle', color: '#dc3545' }
  ];

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
        
        // Get all alumni users
        const usersRef = collection(db, 'users');
        const allUsersQuery = query(usersRef, where('role', '==', 'alumni'));
        const allUsersSnapshot = await getDocs(allUsersQuery);
        
        const allAlumni = allUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Smart suggestions algorithm based on job interests and industries
        const suggestions = allAlumni.map(user => {
          let relevanceScore = 0;
          let reasons = [];
          
          // Course match (highest priority)
          if (currentUser.course && user.course) {
            if ((user.course || '').toLowerCase() === (currentUser.course || '').toLowerCase()) {
              relevanceScore += 100;
              reasons.push('Same course');
            } else if ((user.course || '').toLowerCase().includes((currentUser.course || '').toLowerCase()) || 
                       (currentUser.course || '').toLowerCase().includes((user.course || '').toLowerCase())) {
              relevanceScore += 50;
              reasons.push('Related field');
            }
          }
          
          // Job/Industry interest match
          if (user.industry && currentUser?.interests) {
            const userIndustry = (user.industry || '').toLowerCase();
            const userInterests = (currentUser.interests || '').toLowerCase();
            
            // Direct industry match
            if (userIndustry.includes(userInterests) || userInterests.includes(userIndustry)) {
              relevanceScore += 80;
              reasons.push('Same industry');
            }
            
            // Related industry keywords
            const industryKeywords = {
              'technology': ['software', 'tech', 'it', 'programming', 'development', 'engineering'],
              'healthcare': ['medical', 'health', 'hospital', 'clinic', 'pharmacy'],
              'finance': ['banking', 'financial', 'accounting', 'investment', 'business'],
              'education': ['teaching', 'academic', 'school', 'university', 'training'],
              'marketing': ['advertising', 'digital', 'social media', 'branding', 'sales'],
              'engineering': ['mechanical', 'electrical', 'civil', 'chemical', 'industrial']
            };
            
            for (const [industry, keywords] of Object.entries(industryKeywords)) {
              if (userIndustry.includes(industry) && keywords.some(keyword => userInterests.includes(keyword))) {
                relevanceScore += 60;
                reasons.push('Related industry');
                break;
              }
            }
          }
          
          // Current job/position relevance
          if (user.currentJob && currentUser?.interests) {
            const jobTitle = (user.currentJob || '').toLowerCase();
            const userInterests = (currentUser.interests || '').toLowerCase();
            
            if (jobTitle.includes(userInterests) || userInterests.includes(jobTitle)) {
              relevanceScore += 70;
              reasons.push('Matching job role');
            }
          }
          
          // Batch proximity (recent graduates are more relevant)
          if (user.batch && currentUser.batch) {
            const batchDiff = Math.abs(parseInt(user.batch) - parseInt(currentUser.batch));
            if (batchDiff <= 2) {
              relevanceScore += 30;
              reasons.push('Recent graduate');
            } else if (batchDiff <= 5) {
              relevanceScore += 15;
              reasons.push('Experienced alumni');
            }
          }
          
          // Experience level (more experienced = higher score)
          if (user.experience) {
            const expYears = user.experience.match(/\d+/);
            if (expYears) {
              const years = parseInt(expYears[0]);
              if (years >= 5) {
                relevanceScore += 20;
                reasons.push('Senior professional');
              } else if (years >= 2) {
                relevanceScore += 10;
                reasons.push('Experienced');
              }
            }
          }
          
          // Random factor for discovery (like Facebook)
          relevanceScore += Math.random() * 10;
          
          return {
            id: user.id,
            avatar: (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '') || 'U',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.displayName || 'Alumni User',
            meta: `${user.industry || user.course || 'General'} • ${user.currentJob || 'Professional'}`,
            bio: user.experience || 'Experienced alumni available for mentoring.',
            tags: user.industry ? [user.industry] : (user.course ? [user.course] : ['General']),
            isConnected: false,
            relevanceScore,
            reasons: reasons.slice(0, 2), // Show top 2 reasons
            mutualConnections: Math.floor(Math.random() * 5), // Mock mutual connections
            isOnline: Math.random() > 0.7, // Random online status
            industry: user.industry || 'General',
            currentJob: user.currentJob || 'Professional'
          };
        });
        
        // Sort by relevance score and limit to 6
        const sortedSuggestions = suggestions
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 6);
        
        setSuggestedMentors(sortedSuggestions);
        console.log('Final mentors data:', sortedSuggestions);
        
      } catch (error) {
        console.error('Error fetching suggested mentors:', error);
        setMentorsError('Failed to load mentors. Please try again.');
      } finally {
        setIsLoadingMentors(false);
      }
    };

    fetchSuggestedMentors();
  }, [currentUser]);

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
          role: data.authorRole || 'student',
          meta: `${data.category || 'General'} • ${timeAgo}`,
          roleLabel: data.authorRole === 'alumni' ? 'Mentor' : data.authorRole === 'student' ? 'Student' : 'User',
            content: data.content || 'No content available',
            title: data.title || '',
            category: data.category || 'general',
            likes: data.likes || 0,
            comments: data.replyCount || 0,
            isLiked: false,
            createdAt: data.createdAt,
            authorId: data.authorId,
            isCourseRelevant: data.category && currentUser?.course && 
              ((data.category || '').toLowerCase().includes(currentUser.course.toLowerCase()) ||
               (data.content || '').toLowerCase().includes(currentUser.course.toLowerCase()))
          };
        } catch (error) {
          console.error('Error processing post:', error);
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
          role: data.authorRole || 'student',
          meta: `${data.category || 'General'} • ${timeAgo}`,
          roleLabel: data.authorRole === 'alumni' ? 'Mentor' : data.authorRole === 'student' ? 'Student' : 'User',
            content: data.content || 'No content available',
            title: data.title || '',
            category: data.category || 'general',
            likes: data.likes || 0,
            comments: data.replyCount || 0,
            isLiked: false,
            createdAt: data.createdAt,
            authorId: data.authorId,
            isCourseRelevant: data.category && currentUser?.course && 
              ((data.category || '').toLowerCase().includes(currentUser.course.toLowerCase()) ||
               (data.content || '').toLowerCase().includes(currentUser.course.toLowerCase()))
          };
        } catch (error) {
          console.error('Error processing thread:', error);
          return null;
        }
      }).filter(Boolean);
      
      // Combine and sort by relevance and recency
      const allContent = [...posts, ...threads];
      
      // Sort: Course-relevant content first, then by recency
      const sortedFeed = allContent.sort((a, b) => {
        // Course-relevant content first
        if (a.isCourseRelevant && !b.isCourseRelevant) return -1;
        if (!a.isCourseRelevant && b.isCourseRelevant) return 1;
        
        // Then by recency
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime;
      });
      
      setUnifiedFeed(sortedFeed);
      console.log('Fetched unified feed:', sortedFeed.length);
      
    } catch (error) {
      console.error('Error fetching unified feed:', error);
      setUnifiedFeed([]);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchUnifiedFeed();
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
        color: 0x4361ee,
        backgroundColor: 0x000000,
        points: 10,
        maxDistance: 20,
        spacing: 15,
        showDots: true
      });

      return () => {
        if (vantaEffect && vantaEffect.destroy) {
          vantaEffect.destroy();
        }
      };
    }
  }, []);

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
          postId: postId, // Add postId directly for easier access
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
        y: rect.top - 80
      }
    });
    setShowReactionPicker(prev => ({
      ...prev,
      [postId]: true
    }));
  };

  // Handle reaction picker selection
  const handleReactionSelect = (postId, reactionType, event) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    
    // Handle the reaction first
    handleReaction(postId, reactionType);
    
    // Hide picker after a short delay to ensure reaction is processed
    setTimeout(() => {
      setShowReactionPicker(prev => ({
        ...prev,
        [postId]: false
      }));
    }, 100);
  };

  // Hide reaction picker immediately when mouse leaves
  const hideReactionPicker = (postId) => {
    setShowReactionPicker(prev => ({
      ...prev,
      [postId]: false
    }));
  };

  // Handle mouse enter on reaction picker to keep it open
  const handleReactionPickerMouseEnter = (postId) => {
    setShowReactionPicker(prev => ({
      ...prev,
      [postId]: true
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
          postId: postId, // Add postId directly for easier access
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

  // Edit post function
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

  // Delete post function
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
          {/* Email Verification Banner */}
          <EmailVerificationBanner />
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

              {/* Global Posts Feed */}
              <div className="posts-feed">
                <h2 className="section-title">Recent Posts</h2>
                {posts.length === 0 ? (
                  <div className="no-posts">
                    <p>No posts yet. Be the first to share something!</p>
                  </div>
                ) : (
                  <div className="posts-list">
                    {posts.map((post) => (
                      <div key={post.id} className="post-card">
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
                                <span>{post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}</span>
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
                            onClick={() => likePost(post.id, currentUser.uid)}
                          >
                            <i className="fas fa-thumbs-up"></i>
                            Like ({post.likes || 0})
                          </button>
                          <button className="post-action">
                            <i className="fas fa-comment"></i>
                            Comment ({post.comments || 0})
                          </button>
                          <button className="post-action">
                            <i className="fas fa-share"></i>
                            Share
                          </button>
                        </div>
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
                    <i className="fas fa-video" style={{color: '#1877f2'}}></i>
                    <span>Live video</span>
                  </button>
                  <button 
                    className="creation-action-btn"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <i className="fas fa-images" style={{color: '#1877f2'}}></i>
                    <span>Photo/video</span>
                  </button>
                  <button 
                    className="creation-action-btn"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    <i className="fas fa-smile" style={{color: '#1877f2'}}></i>
                    <span>Feeling/activity</span>
                  </button>
                </div>
              </div>

              <div className="feed-header">
                <h3>Recent Alumni Posts</h3>
                <div className="feed-actions">
                  <button 
                    className="create-post-btn"
                    onClick={() => navigate('/forum')}
                  >
                    <i className="fas fa-plus"></i>
                    Create Post
                  </button>
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
              </div>
              <div className="feed-posts">
                {isLoadingFeed ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading feed...</p>
                  </div>
                ) : unifiedFeed.length > 0 ? (
                  unifiedFeed.map(post => (
                  <div key={post.id} className={`feed-post ${post.isCourseRelevant ? 'course-relevant' : ''}`}>
                    <div className="post-header">
                      <div className="post-avatar">{post.avatar}</div>
                      <div className="post-user">
                        <div className="post-name">
                          {post.name}
                          <span className={`role-badge ${post.role}`}>{post.roleLabel}</span>
                          {post.isCourseRelevant && <span className="course-badge">Relevant to your course</span>}
                        </div>
                        <div className="post-meta">
                          {post.meta}
                          {post.type === 'thread' && <span className="thread-indicator"> • Thread</span>}
                        </div>
                      </div>
                      <div className={`post-badge ${getBadgeClass(post.type)}`}>
                        {getBadgeText(post.type)}
                      </div>
                    </div>
                    <div className="post-content">
                      {editingPost === post.id ? (
                        <div className="edit-post-form">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="edit-textarea"
                            rows="3"
                            placeholder="Edit your post..."
                          />
                          <div className="edit-actions">
                            <button 
                              className="save-btn"
                              onClick={() => handleEditPost(post.id)}
                            >
                              Save
                            </button>
                            <button 
                              className="cancel-btn"
                              onClick={() => {
                                setEditingPost(null);
                                setEditContent('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        post.content
                      )}
                    </div>
                    <div className="post-actions">
                      <div className="action-buttons">
                        <button 
                          className={`action-btn like-btn ${postReactions[post.id]?.userReaction ? 'reacted' : ''}`}
                          onMouseDown={(e) => handleReactionLongPress(post.id, e)}
                          onTouchStart={(e) => handleReactionLongPress(post.id, e)}
                          onMouseLeave={() => hideReactionPicker(post.id)}
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
                          left: `${reactionPickerPosition[post.id]?.x - 60}px`,
                          top: `${reactionPickerPosition[post.id]?.y}px`,
                          zIndex: 1000
                        }}
                        onMouseEnter={() => handleReactionPickerMouseEnter(post.id)}
                        onMouseLeave={() => hideReactionPicker(post.id)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div className="reaction-picker-content">
                          {reactionTypes.map((reaction, index) => (
                            <button
                              key={reaction.type}
                              className="reaction-option"
                              onClick={(e) => handleReactionSelect(post.id, reaction.type, e)}
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

              {/* Suggested Mentors Section */}
              <section className="suggested-mentors">
                <div className="mentors-header">
                  <h2 className="section-title">
                    {currentUser?.course ? `Mentors from ${currentUser.course}` : 'Suggested Mentors'}
                  </h2>
                  <button 
                    className="view-all-btn"
                    onClick={() => navigate('/browse-mentor')}
                  >
                    See All <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
                
                {/* Search and Filter Bar */}
                <div className="mentor-search-section">
                  <div className="search-bar">
                    <i className="fas fa-search"></i>
                    <input 
                      type="text" 
                      placeholder="Search by industry, job role, or company..."
                      className="search-input"
                    />
                  </div>
                  <div className="category-filters">
                    <button className="filter-btn active">All</button>
                    <button className="filter-btn">Technology</button>
                    <button className="filter-btn">Healthcare</button>
                    <button className="filter-btn">Finance</button>
                    <button className="filter-btn">Education</button>
                    <button className="filter-btn">Marketing</button>
                  </div>
                </div>
                <div className="mentors-container">
                  {isLoadingMentors ? (
                    <p style={{ color: '#000000' }}>Loading suggested mentors...</p>
                  ) : mentorsError ? (
                    <p style={{ color: 'red' }}>{mentorsError}</p>
                  ) : suggestedMentors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#000000' }}>
                      <p>No mentors available at the moment.</p>
                      <p>Check back later or browse all mentors.</p>
                    </div>
                  ) : (
                    suggestedMentors.map(mentor => (
                    <div key={mentor.id} className="mentor-card">
                      <div className="mentor-header">
                        <div className="mentor-avatar">
                          {mentor.avatar}
                          {mentor.isOnline && <div className="online-indicator"></div>}
                        </div>
                        <div className="mentor-info">
                          <h3>{mentor.name}</h3>
                          <p className="mentor-industry">{mentor.industry}</p>
                          <p className="mentor-job">{mentor.currentJob}</p>
                          {mentor.reasons && mentor.reasons.length > 0 && (
                            <p className="suggestion-reason">
                              <i className="fas fa-lightbulb"></i>
                              {mentor.reasons.join(', ')}
                            </p>
                          )}
                          {mentor.mutualConnections > 0 && (
                            <p className="mutual-connections">
                              <i className="fas fa-users"></i>
                              {mentor.mutualConnections} mutual connections
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mentor-bio">
                        {mentor.bio}
                      </div>
                      <div className="mentor-tags">
                        <span className="mentor-tag industry-tag">{mentor.industry}</span>
                        <span className="mentor-tag job-tag">{mentor.currentJob}</span>
                      </div>
                      <div className="mentor-actions">
                        <button 
                            className={`btn ${mentor.isConnected ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => handleMentorConnect(mentor.id)}
                            disabled={mentor.isConnected}
                        >
                            {mentor.isConnected ? 'Request Sent' : 'Connect'}
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
          </div>
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

            <div className="post-category-section">
              <span className="category-label">Choose category:</span>
              <div className="category-options">
                {postCategories.map(category => (
                  <button
                    key={category.id}
                    className={`category-option ${createPostData.category === category.id ? 'selected' : ''}`}
                    onClick={() => setCreatePostData({...createPostData, category: category.id})}
                    style={{'--category-color': category.color}}
                  >
                    <i className={category.icon}></i>
                    <span>{category.name}</span>
                  </button>
                ))}
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
    </>
  );
}

export default StudentDashboard;
