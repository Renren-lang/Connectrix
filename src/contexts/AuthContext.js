import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Debug environment info
  console.log('🔧 AuthProvider initialized in environment:', process.env.NODE_ENV);
  console.log('🔧 Current URL:', window.location.href);
  console.log('🔧 Firebase Auth object:', auth);

  // Fetch user profile data from Firestore
  async function fetchUserProfile(uid) {
    try {
      if (!uid || typeof uid !== 'string' || uid.trim() === '') {
        console.error('Invalid user ID provided to fetchUserProfile:', uid);
        return null;
      }

      // Check if user is authenticated before making Firestore calls
      if (!auth.currentUser) {
        console.log('No authenticated user, skipping Firestore fetch');
        return null;
      }

      // Add retry logic for Firestore connection issues
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (!userData || typeof userData !== 'object') {
              console.error('Invalid user data structure:', userData);
              return null;
            }
            return userData;
          }
          return null;
        } catch (error) {
          retryCount++;
          console.warn(`Firestore fetch attempt ${retryCount}/${maxRetries} failed:`, error.message);
          
          // Handle specific Firestore errors
          if (error.code === 'permission-denied') {
            console.warn('Permission denied accessing Firestore. User may not be authenticated.');
            break; // Don't retry permission errors
          } else if (error.code === 'unavailable' || error.message?.includes('Unknown SID')) {
            console.warn('Firestore connection error. Retrying...');
            if (retryCount < maxRetries) {
              // Wait before retry with exponential backoff
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
          }
          
          // If it's not a retryable error or we've exhausted retries
          throw error;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile after retries:', error);
      return null;
    }
  }

  // Update user profile in Firestore
  async function updateUserProfile(uid, profileData) {
    try {
      if (!uid || typeof uid !== 'string' || uid.trim() === '') {
        throw new Error('Invalid user ID provided to updateUserProfile');
      }
      
      if (!profileData || typeof profileData !== 'object') {
        throw new Error('Invalid profile data provided to updateUserProfile');
      }

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, profileData);
      
      // Update local state with new profile data
      if (currentUser && currentUser.uid === uid) {
        setCurrentUser(prev => ({
          ...prev,
          ...profileData
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Sign up function
  async function signup(email, password, role, userData) {
    try {
      if (!email || !password || !role) {
        throw new Error('Missing required fields: email, password, and role are required');
      }

      if (!email.includes('@') || email.length < 5) {
        throw new Error('Invalid email format');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (!['student', 'alumni'].includes(role)) {
        throw new Error('Invalid role. Must be student or alumni');
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      await updateProfile(result.user, {
        displayName: userData.firstName || email.split('@')[0]
      });

      // Send email verification
      try {
        await sendEmailVerification(result.user);
        console.log('Email verification sent to:', result.user.email);
      } catch (verificationError) {
        console.error('Error sending email verification:', verificationError);
      }

      // Prepare user data for Firestore
      const userDataToStore = {
        email: email.trim(),
        username: userData.username || '',
        role: role,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        schoolId: userData.schoolId || '',
        batch: userData.batch || '',
        course: userData.course || '',
        goals: userData.goals || '',
        experience: userData.experience || '',
        skills: userData.skills || '',
        willingToMentor: Boolean(userData.willingToMentor),
        createdAt: new Date(),
        profilePictureUrl: userData.profilePictureUrl || '',
        profilePictureBase64: userData.profilePictureBase64 || '',
        bio: userData.bio || '',
        interests: Array.isArray(userData.interests) ? userData.interests : [],
        graduationYear: userData.graduationYear || '',
        major: userData.major || '',
        company: userData.company || '',
        position: userData.position || '',
        location: userData.location || '',
        phone: userData.phone || '',
        website: userData.website || '',
        linkedin: userData.linkedin || '',
        github: userData.github || '',
        twitter: userData.twitter || '',
        instagram: userData.instagram || '',
        facebook: userData.facebook || '',
        youtube: userData.youtube || '',
        tiktok: userData.tiktok || '',
        snapchat: userData.snapchat || '',
        discord: userData.discord || '',
        telegram: userData.telegram || '',
        whatsapp: userData.whatsapp || '',
        skype: userData.skype || '',
        zoom: userData.zoom || '',
        teams: userData.teams || '',
        slack: userData.slack || '',
        other: userData.other || ''
      };

      // Store user data in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, userDataToStore);
      console.log('User data stored successfully in Firestore');

      return result;
    } catch (error) {
      console.error('Error in signup:', error);
      throw error;
    }
  }

  // Login function
  async function login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the Firebase ID token for backend authentication
      const idToken = await result.user.getIdToken();
      
      // Store the token in localStorage for API calls
      localStorage.setItem('firebaseToken', idToken);
      
      // Fetch user profile and set state
      const profileData = await fetchUserProfile(result.user.uid);
      console.log('🔍 Login - Profile data fetched:', profileData);
      
      const userWithProfile = { ...result.user, ...profileData };
      console.log('🔍 Login - Setting currentUser:', userWithProfile.uid, userWithProfile.email);
      setCurrentUser(userWithProfile);
      
      const userRole = profileData?.role || 'student';
      console.log('🔍 Login - Setting user role:', userRole);
      setUserRole(userRole);
      
      // Also store role in localStorage for immediate access
      localStorage.setItem('userRole', userRole);
      console.log('🔍 Login - Stored role in localStorage:', userRole);
      
      // Store user data in localStorage for persistence
      localStorage.setItem('user', JSON.stringify({
        uid: userWithProfile.uid,
        email: userWithProfile.email,
        displayName: userWithProfile.displayName,
        role: userRole
      }));
      console.log('🔍 Login - Stored user data in localStorage');
      
      setLoading(false);
      console.log('🔍 Login - Login completed successfully, user should be redirected');
      console.log('🔍 Login - Final state - currentUser:', !!userWithProfile, 'userRole:', userRole, 'loading:', false);
      
      return result;
    } catch (error) {
      console.error('Error in login:', error);
      
      // Provide specific error messages
      switch (error.code) {
        case 'auth/invalid-credential':
          throw new Error('Invalid email or password');
        case 'auth/user-not-found':
          throw new Error('No account found with this email');
        case 'auth/wrong-password':
          throw new Error('Incorrect password');
        case 'auth/invalid-email':
          throw new Error('Invalid email address');
        case 'auth/user-disabled':
          throw new Error('This account has been disabled');
        case 'auth/too-many-requests':
          throw new Error('Too many failed attempts. Please try again later');
        case 'auth/network-request-failed':
          throw new Error('Network error. Please check your connection');
        default:
          throw new Error(error.message || 'Login failed');
      }
    }
  }

  // Logout function
  function logout() {
    // Clear all user data
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    console.log('🔑 User logged out, state cleared');
    return signOut(auth);
  }

  // Get Firebase ID token for API calls
  async function getFirebaseToken() {
    try {
      if (currentUser) {
        const token = await currentUser.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return token;
      }
      return localStorage.getItem('firebaseToken');
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      return null;
    }
  }

  // Get user role
  async function getUserRole(uid) {
    try {
      const profileData = await fetchUserProfile(uid);
      return profileData?.role || 'student';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'student';
    }
  }

  // Refresh user role
  async function refreshUserRole() {
    if (currentUser) {
      const role = await getUserRole(currentUser.uid);
      setUserRole(role);
      return role;
    }
    return null;
  }

  // Google authentication function with popup and redirect fallback
  async function signInWithGoogle(additionalData = {}) {
    try {
      const provider = new GoogleAuthProvider();
      
      // Add custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account' // Allow account selection
      });
      
      console.log('🔧 Starting Google authentication with provider:', provider);
      console.log('🔧 Additional data:', additionalData);
      
      // Store additional data for redirect fallback
      if (additionalData.role) {
        localStorage.setItem('googleAuthRole', additionalData.role);
        localStorage.setItem('googleAuthData', JSON.stringify(additionalData));
      }
      
      console.log('🔧 Attempting popup authentication...');
      const result = await signInWithPopup(auth, provider);
      
      // Process the user data immediately
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: additionalData.role || 'student',
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          createdAt: new Date(),
          profilePictureUrl: user.photoURL || '',
          ...additionalData
        };
        await setDoc(userRef, newUser);
        console.log('Google user created in Firestore via popup');
      } else {
        console.log('Google user already exists in Firestore via popup');
      }

      // Get the Firebase ID token for backend authentication
      const idToken = await user.getIdToken();
      localStorage.setItem('firebaseToken', idToken);
      
      // Save to localStorage for persistence
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userRole", additionalData.role || 'student');
      
      // Set user state immediately
      const profileData = await fetchUserProfile(user.uid);
      const userWithProfile = { ...user, ...profileData };
      setCurrentUser(userWithProfile);
      setUserRole(profileData?.role || additionalData.role || 'student');
      setLoading(false);
      
      console.log('✅ Google popup authentication successful');
      return { success: true, user: userWithProfile };
      
    } catch (error) {
      // Handle specific error cases with better user guidance BEFORE logging
      if (error.code === 'auth/popup-closed-by-user') {
        // Don't log as error for popup closed, just return a failure
        console.log('ℹ️ User closed the popup or it was closed by browser');
        return { success: false, error: 'popup_closed_by_user' }; // Match the onFailure expected format
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('ℹ️ Popup request was cancelled');
        return { success: false, error: 'cancelled' }; // Match the onFailure expected format
      }
      
      // Log other errors normally
      console.error('Google sign-in error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Handle remaining error cases
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled. Please contact support.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please wait a moment and try again.');
      }
      
      throw error;
    }
  }




  // Note: Redirect handling removed for simplicity and reliability
  // All Google authentication now uses popup method only

  // Initialize authentication state from localStorage on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedRole = localStorage.getItem('userRole');
        
        if (storedUser && storedRole) {
          console.log('🔑 Restoring user from localStorage:', storedUser);
          const userData = JSON.parse(storedUser);
          setCurrentUser(userData);
          setUserRole(storedRole);
          console.log('🔑 User restored:', { uid: userData.uid, email: userData.email, role: storedRole });
        } else {
          console.log('🔑 No stored user found');
        }
      } catch (error) {
        console.error('Error initializing auth from localStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);


  // Debug function to check authentication state
  const debugAuthState = () => {
    console.group('🔍 Current Authentication State');
    console.log('Current User:', currentUser);
    console.log('User Role:', userRole);
    console.log('Loading:', loading);
    console.log('Firebase Auth Current User:', auth.currentUser);
    console.groupEnd();
  };

  const value = {
    currentUser,
    userRole,
    loading,
    signup,
    login,
    logout,
    getFirebaseToken,
    getUserRole,
    refreshUserRole,
    updateUserProfile,
    fetchUserProfile,
    signInWithGoogle,
    debugAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}