import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, limit, orderBy, doc, updateDoc, addDoc, serverTimestamp, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

function AlumniDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const vantaRef = useRef(null);
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
    { type: 'like', emoji: '👍', label: 'Like', color: '#1877f2' },
    { type: 'love', emoji: '❤️', label: 'Love', color: '#e74c3c' },
    { type: 'laugh', emoji: '😂', label: 'Haha', color: '#f39c12' },
    { type: 'wow', emoji: '😮', label: 'Wow', color: '#f1c40f' },
    { type: 'sad', emoji: '😢', label: 'Sad', color: '#9b59b6' },
    { type: 'angry', emoji: '😡', label: 'Angry', color: '#e67e22' }
  ];

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
        // Load reactions for each post
        fetchPostReactions(post.id);
      });
    }
  }, [feedPosts, currentUser]);

  // Load comment reactions when comments change
  useEffect(() => {
    Object.values(comments).forEach(postComments => {
      if (postComments && postComments.length > 0) {
        postComments.forEach(comment => {
          if (!commentReactions[comment.id]) {
            fetchCommentReactions(comment.id);
          }
        });
      }
    });
  }, [comments, currentUser]);

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
        backgroundColor: 0xffffff,
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
      
      // Debug log to see post structure
      console.log('Post data for reaction:', {
        id: post.id,
        authorId: post.authorId,
        content: post.content?.substring(0, 50),
        hasAuthorId: !!post.authorId
      });

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
        
        // Create notification for post author (only if authorId exists)
        if (post.authorId) {
          await createReactionNotification(post.authorId, postId, reactionType, post.content);
        }
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
          
          // Create notification for post author (only if authorId exists)
          if (post.authorId) {
            await createReactionNotification(post.authorId, postId, reactionType, post.content);
          }
        }
      }

      console.log('Reaction handled successfully');
      
    } catch (error) {
      console.error('Error handling reaction:', error);
      alert('Failed to react to post. Please try again.');
    }
  };

  const createReactionNotification = async (authorId, postId, reactionType, postContent) => {
    // Validate required data
    if (!authorId || authorId === currentUser.uid) return; // Don't notify self or if no author
    if (!postId || !reactionType || !postContent) {
      console.warn('Missing required data for reaction notification:', { authorId, postId, reactionType, postContent });
      return;
    }

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

  // Handle comment reactions
  const handleCommentReaction = async (commentId, reactionType) => {
    if (!currentUser) {
      alert('Please log in to react to comments');
      return;
    }

    try {
      console.log('Handling comment reaction:', { commentId, reactionType, userId: currentUser.uid });

      const commentReactionsRef = collection(db, 'post-comments', commentId, 'reactions');
      const userReactionQuery = query(commentReactionsRef, where('userId', '==', currentUser.uid));
      const userReactionSnapshot = await getDocs(userReactionQuery);

      if (userReactionSnapshot.empty) {
        // Add new reaction
        console.log('Adding new comment reaction');
        await addDoc(commentReactionsRef, {
          userId: currentUser.uid,
          type: reactionType,
          createdAt: serverTimestamp()
        });
      } else {
        // Update existing reaction
        const existingReaction = userReactionSnapshot.docs[0];
        const existingType = existingReaction.data().type;
        
        if (existingType === reactionType) {
          // Remove reaction if same type
          console.log('Removing existing comment reaction');
          await deleteDoc(existingReaction.ref);
        } else {
          // Update to new reaction type
          console.log('Updating comment reaction type from', existingType, 'to', reactionType);
          await updateDoc(existingReaction.ref, {
            type: reactionType,
            updatedAt: serverTimestamp()
          });
        }
      }

      console.log('Comment reaction handled successfully');
      
    } catch (error) {
      console.error('Error handling comment reaction:', error);
      alert('Failed to react to comment. Please try again.');
    }
  };

  // Fetch comment reactions
  const fetchCommentReactions = async (commentId) => {
    try {
      const commentReactionsRef = collection(db, 'post-comments', commentId, 'reactions');
      const unsubscribe = onSnapshot(commentReactionsRef, (snapshot) => {
        const reactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Count reactions by type
        const counts = {};
        let userReaction = null;
        let total = 0;

        reactionsData.forEach(reaction => {
          if (reaction.userId === currentUser?.uid) {
            userReaction = reaction.type;
          }
          counts[reaction.type] = (counts[reaction.type] || 0) + 1;
          total++;
        });

        setCommentReactions(prev => ({
          ...prev,
          [commentId]: {
            counts,
            userReaction,
            total
          }
        }));
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching comment reactions:', error);
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

  // Comment reaction handlers
  const handleCommentReactionLongPress = (commentId, event) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setCommentReactionPickerPosition({
      [commentId]: {
        x: rect.left + rect.width / 2,
        y: rect.top - 80
      }
    });
    setShowCommentReactionPicker(prev => ({
      ...prev,
      [commentId]: true
    }));
  };

  const handleCommentReactionSelect = (commentId, reactionType, event) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    
    // Handle the comment reaction
    handleCommentReaction(commentId, reactionType);
    
    // Hide picker after a short delay
    setTimeout(() => {
      setShowCommentReactionPicker(prev => ({
        ...prev,
        [commentId]: false
      }));
    }, 100);
  };

  const hideCommentReactionPicker = (commentId) => {
    setShowCommentReactionPicker(prev => ({
      ...prev,
      [commentId]: false
    }));
  };

  const handleCommentReactionPickerMouseEnter = (commentId) => {
    setShowCommentReactionPicker(prev => ({
      ...prev,
      [commentId]: true
    }));
  };

  // Share post handlers
  const handleSharePost = (post) => {
    setSelectedPostForShare(post);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSelectedPostForShare(null);
  };

  const copyPostLink = async () => {
    if (!selectedPostForShare) return;
    
    try {
      const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
      await navigator.clipboard.writeText(postUrl);
      alert('Post link copied to clipboard!');
      closeShareModal();
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  const shareOnFacebook = () => {
    if (!selectedPostForShare) return;
    
    const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    closeShareModal();
  };

  const shareOnTwitter = () => {
    if (!selectedPostForShare) return;
    
    const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
    const text = `Check out this post: ${selectedPostForShare.content.substring(0, 100)}...`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    closeShareModal();
  };

  const shareOnLinkedIn = () => {
    if (!selectedPostForShare) return;
    
    const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
    closeShareModal();
  };

  const shareViaEmail = () => {
    if (!selectedPostForShare) return;
    
    const postUrl = `${window.location.origin}/post/${selectedPostForShare.id}`;
    const subject = `Check out this post from Connectrix`;
    const body = `I found this interesting post and wanted to share it with you:\n\n"${selectedPostForShare.content}"\n\nView the full post: ${postUrl}`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    closeShareModal();
  };

  const handlePostAction = (postId, actionType) => {
    if (actionType === 'like') {
      handleReaction(postId, 'like');
    } else if (actionType === 'comment') {
      // Toggle comment section instead of navigating
      setExpandedComments(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    } else if (actionType === 'share') {
      const post = feedPosts.find(p => p.id === postId);
      if (post) {
        handleSharePost(post);
      }
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
      {/* Vanta.js Background */}
      <div ref={vantaRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}></div>
      
      {/* Main Dashboard Content */}
      <main className="dashboard" style={{ position: 'relative', zIndex: 1 }}>
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
                                    className={`comment-reaction-btn ${commentReactions[comment.id]?.userReaction ? 'reacted' : ''}`}
                                    onMouseDown={(e) => handleCommentReactionLongPress(comment.id, e)}
                                    onTouchStart={(e) => handleCommentReactionLongPress(comment.id, e)}
                                    onMouseLeave={() => hideCommentReactionPicker(comment.id)}
                                  >
                                    <i className={`fas fa-thumbs-up ${commentReactions[comment.id]?.userReaction === 'like' ? 'active' : ''}`}></i>
                                    <span>
                                      {commentReactions[comment.id]?.userReaction ? 
                                        reactionTypes.find(r => r.type === commentReactions[comment.id].userReaction)?.emoji : 
                                        'Like'
                                      }
                                    </span>
                                    {commentReactions[comment.id]?.total > 0 && (
                                      <span className="reaction-count">{commentReactions[comment.id].total}</span>
                                    )}
                                  </button>
                                  <button 
                                    className="reply-btn"
                                    onClick={() => handleReplyToComment(post.id, comment.id, comment.authorName)}
                                  >
                                    Reply
                                  </button>
                                </div>

                                {/* Comment Reaction Picker */}
                                {showCommentReactionPicker[comment.id] && (
                                  <div 
                                    className="reaction-picker comment-reaction-picker"
                                    style={{
                                      position: 'fixed',
                                      left: `${commentReactionPickerPosition[comment.id]?.x - 60}px`,
                                      top: `${commentReactionPickerPosition[comment.id]?.y}px`,
                                      zIndex: 1000
                                    }}
                                    onMouseEnter={() => handleCommentReactionPickerMouseEnter(comment.id)}
                                    onMouseLeave={() => hideCommentReactionPicker(comment.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <div className="reaction-picker-content">
                                      {reactionTypes.map((reaction, index) => (
                                        <button
                                          key={reaction.type}
                                          className="reaction-option"
                                          onClick={(e) => handleCommentReactionSelect(comment.id, reaction.type, e)}
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

      {/* Share Post Modal */}
      {showShareModal && selectedPostForShare && (
        <div className="modal-overlay" onClick={closeShareModal}>
          <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Post</h3>
              <button className="close-btn" onClick={closeShareModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="share-post-preview">
              <div className="post-preview-header">
                <div className="post-preview-avatar">
                  {selectedPostForShare.authorName ? selectedPostForShare.authorName.split(' ').map(n => n[0]).join('') : 'U'}
                </div>
                <div className="post-preview-info">
                  <span className="post-preview-author">{selectedPostForShare.authorName}</span>
                  <span className="post-preview-role">{selectedPostForShare.authorRole}</span>
                </div>
              </div>
              <div className="post-preview-content">
                {selectedPostForShare.content}
              </div>
            </div>

            <div className="share-options">
              <button className="share-option" onClick={copyPostLink}>
                <i className="fas fa-link"></i>
                <span>Copy Link</span>
              </button>
              
              <button className="share-option" onClick={shareOnFacebook}>
                <i className="fab fa-facebook-f"></i>
                <span>Share on Facebook</span>
              </button>
              
              <button className="share-option" onClick={shareOnTwitter}>
                <i className="fab fa-twitter"></i>
                <span>Share on Twitter</span>
              </button>
              
              <button className="share-option" onClick={shareOnLinkedIn}>
                <i className="fab fa-linkedin-in"></i>
                <span>Share on LinkedIn</span>
              </button>
              
              <button className="share-option" onClick={shareViaEmail}>
                <i className="fas fa-envelope"></i>
                <span>Share via Email</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AlumniDashboard;
