import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, orderBy, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const PostsContext = createContext();

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};

export const PostsProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Create a new post
  const createPost = async (postData) => {
    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...postData,
        createdAt: new Date(),
        likes: 0,
        comments: 0,
        shares: 0,
        likedBy: [],
        commentsList: []
      });
      
      console.log('Post created with ID: ', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post: ', error);
      setError('Failed to create post');
      throw error;
    }
  };

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPosts(postsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching posts: ', error);
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listener for posts
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let unsubscribe = null;

    const setupListener = () => {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!isMounted) return;
          
          try {
            const postsData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            setPosts(postsData);
            setLoading(false);
            setError(null);
          } catch (error) {
            console.error('Error processing posts data:', error);
            if (isMounted) {
              setError('Failed to process posts data');
              setLoading(false);
            }
          }
        }, (error) => {
          console.error('Error listening to posts:', error);
          if (isMounted) {
            setError('Failed to listen to posts');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error setting up posts listener:', error);
        if (isMounted) {
          setError('Failed to set up posts listener');
          setLoading(false);
        }
      }
    };

    setupListener();

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
  }, [currentUser]);

  // Like a post
  const likePost = async (postId, userId) => {
    try {
      // This would typically update the post in Firestore
      // For now, we'll just update the local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? {
                ...post,
                likes: post.likedBy?.includes(userId) 
                  ? post.likes - 1 
                  : post.likes + 1,
                likedBy: post.likedBy?.includes(userId)
                  ? post.likedBy.filter(id => id !== userId)
                  : [...(post.likedBy || []), userId]
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post: ', error);
      setError('Failed to like post');
    }
  };

  // Add comment to a post
  const addComment = async (postId, commentData) => {
    try {
      // This would typically update the post in Firestore
      // For now, we'll just update the local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? {
                ...post,
                comments: post.comments + 1,
                commentsList: [...(post.commentsList || []), {
                  id: Date.now().toString(),
                  ...commentData,
                  createdAt: new Date()
                }]
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error adding comment: ', error);
      setError('Failed to add comment');
    }
  };

  const value = {
    posts,
    loading,
    error,
    createPost,
    fetchPosts,
    likePost,
    addComment
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

