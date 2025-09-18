import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
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

  // Google authentication function using popup with redirect fallback
  async function signInWithGoogle(additionalData = {}) {
    try {
      const provider = new GoogleAuthProvider();
      
      // Add custom parameters
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('🔧 Starting Google authentication with provider:', provider);
      console.log('🔧 Additional data:', additionalData);
      
      // Try popup first, fallback to redirect if it fails
      let result;
      try {
        console.log('🔧 Attempting popup method...');
        result = await signInWithPopup(auth, provider);
        console.log('🔧 Popup completed successfully:', result);
      } catch (popupError) {
        console.log('🔧 Popup failed, trying redirect method:', popupError);
        
        // Store the additional data for redirect
        localStorage.setItem('googleAuthData', JSON.stringify(additionalData));
        
        // Use redirect method as fallback
        await signInWithRedirect(auth, provider);
        return { success: true, redirect: true };
      }
      
      if (result && result.user) {
        const user = result.user;
        console.log("✅ Logged in as:", user.email);
        
        // Process the result immediately - minimal processing
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

        // Save to localStorage for persistence - this is the key!
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userRole", additionalData.role || 'student');
        
        console.log('User data saved to localStorage:', {
          uid: user.uid,
          email: user.email,
          role: additionalData.role || 'student'
        });
      }
      
      return { success: true, user: result.user };
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      // Handle specific errors
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by the browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.message === 'Popup timeout') {
        throw new Error('Sign-in timed out. Please try again.');
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



  // Handle Google redirect result
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('🔧 Google redirect result:', result);
          
          // Get stored additional data
          const storedData = localStorage.getItem('googleAuthData');
          const additionalData = storedData ? JSON.parse(storedData) : {};
          localStorage.removeItem('googleAuthData');
          
          // Process the user data
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
            console.log('Google user created in Firestore via redirect');
          } else {
            console.log('Google user already exists in Firestore via redirect');
          }

          // Save to localStorage for persistence
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("userRole", additionalData.role || 'student');
          
          // Redirect to appropriate dashboard
          const role = additionalData.role || 'student';
          if (role === 'student') {
            window.location.href = '/student-dashboard';
          } else if (role === 'alumni') {
            window.location.href = '/alumni-dashboard';
          } else {
            window.location.href = '/student-dashboard';
          }
        }
      } catch (error) {
        console.error('Error handling Google redirect:', error);
      }
    };

    handleGoogleRedirect();
  }, []);

  // Handle auth state changes for persistence
  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      console.log('🔑 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      
      try {
        if (user) {
          console.log("🔑 Already logged in:", user.email);
          
          // User is signed in - fetch profile and set state
          try {
            const profileData = await fetchUserProfile(user.uid);
            if (isMounted) {
              const userWithProfile = { ...user, ...profileData };
              setCurrentUser(userWithProfile);
              setUserRole(profileData?.role || 'student');
              
              // Save to localStorage for persistence
              localStorage.setItem("user", JSON.stringify(user));
              localStorage.setItem("userRole", profileData?.role || 'student');
              
              console.log('User authenticated and persisted:', {
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
              localStorage.setItem("user", JSON.stringify(user));
              localStorage.setItem("userRole", 'student');
            }
          }
        } else {
          console.log("🚪 No user logged in");
          // User is signed out - clear state and localStorage
          if (isMounted) {
            setCurrentUser(null);
            setUserRole(null);
            localStorage.removeItem("user");
            localStorage.removeItem("userRole");
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

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
    debugAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}