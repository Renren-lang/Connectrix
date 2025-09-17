import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Fetch user profile data from Firestore
  async function fetchUserProfile(uid) {
    try {
      if (!uid || typeof uid !== 'string' || uid.trim() === '') {
        console.error('Invalid user ID provided to fetchUserProfile:', uid);
        return null;
      }

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
      console.error('Error fetching user profile:', error);
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

      if (!['student', 'alumni', 'admin'].includes(role)) {
        throw new Error('Invalid role. Must be student, alumni, or admin');
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
    return signOut(auth);
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

  // Google authentication function with fallback to redirect
  async function signInWithGoogle(additionalData = {}) {
    try {
      const provider = new GoogleAuthProvider();
      
      // Add custom parameters to prevent popup blocking
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Try popup first, fallback to redirect if blocked
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError) {
        console.log('Popup blocked, trying redirect method...', popupError.code);
        
        // If popup is blocked, use redirect method
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          // Store additional data for after redirect
          if (Object.keys(additionalData).length > 0) {
            localStorage.setItem('googleAuthData', JSON.stringify(additionalData));
          }
          
          // Use redirect method
          await signInWithRedirect(auth, provider);
          return { success: true, redirect: true };
        }
        throw popupError;
      }

      // Handle successful popup authentication
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          role: 'student',
          createdAt: new Date(),
          profilePictureUrl: result.user.photoURL || '',
          ...additionalData
        };
        await setDoc(userRef, newUser);
        console.log('Google user created in Firestore');
      } else {
        console.log('Google user already exists in Firestore');
      }

      setCurrentUser(result.user);
      setUserRole('student'); // default role for Google users
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific popup blocked error
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by the browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in was cancelled. Please try again.');
      }
      
      throw error;
    }
  }

  // Handle Google redirect result
  async function handleGoogleRedirect() {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('Google redirect result:', result);
        
        // Get stored additional data
        const storedData = localStorage.getItem('googleAuthData');
        const additionalData = storedData ? JSON.parse(storedData) : {};
        
        // Clear stored data
        localStorage.removeItem('googleAuthData');
        
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const newUser = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            role: 'student',
            createdAt: new Date(),
            profilePictureUrl: result.user.photoURL || '',
            ...additionalData
          };
          await setDoc(userRef, newUser);
          console.log('Google user created in Firestore via redirect');
        } else {
          console.log('Google user already exists in Firestore via redirect');
        }

        setCurrentUser(result.user);
        setUserRole('student');
        return { success: true, user: result.user };
      }
      return { success: false };
    } catch (error) {
      console.error('Error handling Google redirect:', error);
      return { success: false, error };
    }
  }

  // Send email verification
  const sendEmailVerificationToUser = async () => {
    try {
      if (currentUser && !currentUser.emailVerified) {
        await sendEmailVerification(currentUser);
        console.log('Email verification sent to:', currentUser.email);
        return { success: true, message: 'Verification email sent successfully' };
      } else if (currentUser && currentUser.emailVerified) {
        return { success: false, message: 'Email is already verified' };
      } else {
        return { success: false, message: 'No user logged in' };
      }
    } catch (error) {
      console.error('Error sending email verification:', error);
      return { success: false, message: 'Failed to send verification email' };
    }
  };

  // Simplified onAuthStateChanged with redirect handling
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      // Check for redirect result first
      try {
        const redirectResult = await handleGoogleRedirect();
        if (redirectResult.success) {
          console.log('Google redirect authentication successful');
          return;
        }
      } catch (error) {
        console.error('Error handling redirect:', error);
      }
      
      // Set up auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        
        console.log('Firebase auth state changed:', user ? `User: ${user.uid}` : 'No user');
        
        try {
          if (user) {
            // User is signed in
            try {
              const profileData = await fetchUserProfile(user.uid);
              if (isMounted) {
                const userWithProfile = { ...user, ...profileData };
                setCurrentUser(userWithProfile);
                setUserRole(profileData?.role || 'student');
                console.log('User authenticated:', {
                  uid: userWithProfile.uid,
                  email: userWithProfile.email,
                  role: profileData?.role || 'student'
                });
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              if (isMounted) {
                setCurrentUser(user);
                setUserRole('student');
              }
            }
          } else {
            // User is signed out
            console.log('User signed out');
            if (isMounted) {
              setCurrentUser(null);
              setUserRole(null);
            }
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      });

      return unsubscribe;
    };

    initializeAuth().then(unsubscribe => {
      return () => {
        isMounted = false;
        if (unsubscribe) unsubscribe();
      };
    });
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
    getUserRole,
    refreshUserRole,
    updateUserProfile,
    fetchUserProfile,
    signInWithGoogle,
    handleGoogleRedirect,
    sendEmailVerificationToUser,
    debugAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}