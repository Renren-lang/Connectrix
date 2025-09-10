import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, limit, orderBy, doc, updateDoc, addDoc, serverTimestamp, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import DashboardLayout from '../components/DashboardLayout';

function StudentDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [suggestedMentors, setSuggestedMentors] = useState([
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      title: 'Senior Software Engineer at Google',
      expertise: 'Machine Learning, AI',
      experience: '8 years',
      rating: 4.9,
      students: 45,
      image: null
    },
    {
      id: 2,
      name: 'Michael Chen',
      title: 'Product Manager at Microsoft',
      expertise: 'Product Strategy, UX Design',
      experience: '6 years',
      rating: 4.8,
      students: 32,
      image: null
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      title: 'Data Scientist at Amazon',
      expertise: 'Data Analysis, Python',
      experience: '5 years',
      rating: 4.7,
      students: 28,
      image: null
    }
  ]);

  const [feedPosts, setFeedPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postReactions, setPostReactions] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState({});
  const [reactionPickerPosition, setReactionPickerPosition] = useState({});
        
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

  // Fetch reactions for posts
  useEffect(() => {
    if (feedPosts.length > 0) {
      feedPosts.forEach(post => {
        fetchPostReactions(post.id);
      });
    }
  }, [feedPosts]);

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
      
    } catch (error) {
      console.error('Error handling reaction:', error);
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

  const handleRequestMentorship = (mentorId) => {
    // Navigate to mentorship request page or show modal
    navigate(`/request-mentorship/${mentorId}`);
  };

  const filteredMentors = suggestedMentors.filter(mentor => 
    activeFilter === 'All' || mentor.expertise.toLowerCase().includes(activeFilter.toLowerCase())
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
    <DashboardLayout userRole="student">
      {/* Connectrix Background Image */}
      <div 
        style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1,
          backgroundImage: 'url(/assets/image.png)', backgroundSize: 'cover',
          backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed'
        }}
      ></div>
      
      {/* Main Dashboard Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {currentUser?.displayName || 'Student'}!
          </h1>
          <p className="text-gray-300 text-lg">
            Here's what's happening with your mentorship network today.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Suggested Mentors */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Suggested Mentors</h2>
                <div className="flex space-x-2">
                  {['All', 'AI/ML', 'Product', 'Data'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        activeFilter === filter
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredMentors.map(mentor => (
                  <div key={mentor.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          {mentor.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{mentor.name}</h3>
                        <p className="text-sm text-gray-600">{mentor.title}</p>
                        <p className="text-sm text-blue-600 font-medium">{mentor.expertise}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{mentor.experience} exp</span>
                          <span>⭐ {mentor.rating}</span>
                          <span>{mentor.students} students</span>
                        </div>
                        <button
                          onClick={() => handleRequestMentorship(mentor.id)}
                          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Request Mentorship
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Alumni Posts */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Alumni Posts</h2>
              
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
                            {post.authorName?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-800">{post.authorName || 'Alumni'}</h3>
                            <span className="text-sm text-gray-500">{post.authorRole || 'Alumni'}</span>
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
                            onClick={() => navigate('/forum')}
                            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <span>💬</span>
                            <span className="text-sm">Comment</span>
                          </button>
                          
                          <button
                            onClick={() => navigate('/forum')}
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;
