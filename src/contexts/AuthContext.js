import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ErrorHandler } from '../utils/errorHandler';

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
      // Validate input
      if (!uid || typeof uid !== 'string' || uid.trim() === '') {
        console.error('Invalid user ID provided to fetchUserProfile:', uid);
        return null;
      }

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Validate user data structure
        if (!userData || typeof userData !== 'object') {
          console.error('Invalid user data structure:', userData);
          return null;
        }
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        uid: uid
      });
      // Return null instead of throwing to prevent crashes
      return null;
    }
  }

  // Update user profile in Firestore
  async function updateUserProfile(uid, profileData) {
    try {
      // Validate input
      if (!uid || typeof uid !== 'string' || uid.trim() === '') {
        throw new Error('Invalid user ID provided to updateUserProfile');
      }
      
      if (!profileData || typeof profileData !== 'object') {
        throw new Error('Invalid profile data provided to updateUserProfile');
      }

      // Validate and sanitize profile data using ErrorHandler
      const sanitizedData = ErrorHandler.validateFirestoreData(profileData, 'user_profile_update');
      
      // Check request size
      const sizeInfo = ErrorHandler.checkRequestSize(sanitizedData);
      if (sizeInfo.warnings.length > 0) {
        console.warn('Profile update size warnings:', sizeInfo.warnings);
      }

      const userRef = doc(db, 'users', uid);
      
      try {
        console.log('Attempting to update user profile in Firestore:', {
          uid: uid,
          dataKeys: Object.keys(sanitizedData),
          dataSize: JSON.stringify(sanitizedData).length
        });
        
        await updateDoc(userRef, sanitizedData);
        console.log('User profile updated successfully in Firestore');
      } catch (firestoreError) {
        ErrorHandler.logError(firestoreError, 'user_profile_update_firestore', {
          uid: uid,
          dataKeys: Object.keys(sanitizedData),
          dataSize: JSON.stringify(sanitizedData).length,
          sizeInfo: sizeInfo
        });
        throw firestoreError;
      }
      
      // Update local state with new profile data
      if (currentUser && currentUser.uid === uid) {
        setCurrentUser(prev => ({
          ...prev,
          ...sanitizedData
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        uid: uid,
        profileData: profileData
      });
      throw error;
    }
  }

  // Sign up function
  async function signup(email, password, role, userData) {
    try {
      // Set registration flag to prevent navigation
      setIsRegistration(true);
      
      // Validate inputs
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

      // Prepare user data for validation
      const userDataToValidate = {
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

      // Validate and sanitize user data using ErrorHandler
      const sanitizedUserData = ErrorHandler.validateFirestoreData(userDataToValidate, 'user_signup');
      
      // Check request size
      const sizeInfo = ErrorHandler.checkRequestSize(sanitizedUserData);
      if (sizeInfo.warnings.length > 0) {
        console.warn('Request size warnings:', sizeInfo.warnings);
      }

      // Store additional user data in Firestore with enhanced error handling
      const userRef = doc(db, 'users', result.user.uid);
      
      try {
        console.log('Attempting to store user data in Firestore:', {
          uid: result.user.uid,
          email: sanitizedUserData.email,
          role: sanitizedUserData.role,
          dataSize: JSON.stringify(sanitizedUserData).length
        });
        
        await setDoc(userRef, sanitizedUserData);
        console.log('User data stored successfully in Firestore');
      } catch (firestoreError) {
        ErrorHandler.logError(firestoreError, 'user_signup_firestore', {
          uid: result.user.uid,
          dataKeys: Object.keys(sanitizedUserData),
          dataSize: JSON.stringify(sanitizedUserData).length,
          sizeInfo: sizeInfo
        });
        
        // If Firestore fails, still allow user creation but log the error
        console.warn('User created in Firebase Auth but Firestore storage failed');
      }

      // Store role and user data in localStorage for persistence
      localStorage.setItem('userRole', role);
      localStorage.setItem('adminUser', JSON.stringify(result.user));

      // Reset Google auth flag to prevent navigation after registration
      setIsGoogleAuth(false);

      return result;
    } catch (error) {
      console.error('Error in signup:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        email: email,
        role: role
      });
      // Reset registration flag on error
      setIsRegistration(false);
      throw error;
    }
  }

  // Login function
  async function login(email, password) {
    try {
      console.log('Attempting to sign in with email:', email);
      console.log('Firebase Auth instance:', auth);
      console.log('Auth app:', auth.app);
      
      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      
      // Validate password
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.uid);
      
      // Get user role from Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const role = userSnap.data().role;
        console.log('User role found:', role);
        setUserRole(role);
        // Store role and user data in localStorage for persistence
        localStorage.setItem('userRole', role);
        localStorage.setItem('adminUser', JSON.stringify(result.user));
      } else {
        console.log('User document does not exist, creating default...');
        // Create a default user document if it doesn't exist
        const defaultUserData = {
          firstName: result.user.displayName?.split(' ')[0] || '',
          lastName: result.user.displayName?.split(' ')[1] || '',
          email: result.user.email,
          role: 'student', // Default role
          createdAt: new Date(),
          profilePictureUrl: result.user.photoURL || '',
          profilePictureBase64: '',
          bio: '',
          skills: [],
          interests: [],
          graduationYear: '',
          major: '',
          company: '',
          position: '',
          experience: '',
          location: '',
          phone: '',
          website: '',
          linkedin: '',
          github: '',
          twitter: '',
          instagram: '',
          facebook: '',
          youtube: '',
          tiktok: '',
          snapchat: '',
          discord: '',
          telegram: '',
          whatsapp: '',
          skype: '',
          zoom: '',
          teams: '',
          slack: '',
          other: ''
        };
        
        try {
          await setDoc(userRef, defaultUserData);
          console.log('Default user document created successfully');
          setUserRole('student');
          // Store role and user data in localStorage for persistence
          localStorage.setItem('userRole', 'student');
          localStorage.setItem('adminUser', JSON.stringify(result.user));
        } catch (createError) {
          console.error('Error creating user document:', createError);
          // Don't throw error, just use default role
          setUserRole('student');
          localStorage.setItem('userRole', 'student');
          localStorage.setItem('adminUser', JSON.stringify(result.user));
        }
      }
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      
      // Handle specific Firebase Auth errors with detailed logging
      if (error.code === 'auth/invalid-credential') {
        console.error('Invalid credential error - email or password is incorrect');
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/user-not-found') {
        console.error('User not found error - no account exists with this email');
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        console.error('Wrong password error - password is incorrect');
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        console.error('Invalid email error - email format is invalid');
        throw new Error('Invalid email address format.');
      } else if (error.code === 'auth/user-disabled') {
        console.error('User disabled error - account has been disabled');
        throw new Error('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/too-many-requests') {
        console.error('Too many requests error - rate limit exceeded');
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        console.error('Network request failed - connection issue');
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/operation-not-allowed') {
        console.error('Operation not allowed - email/password auth not enabled');
        throw new Error('Email/password authentication is not enabled. Please contact support.');
      } else if (error.code === 'auth/weak-password') {
        console.error('Weak password error - password is too weak');
        throw new Error('Password is too weak. Please choose a stronger password.');
      } else {
        console.error('Unknown authentication error:', error);
        throw new Error(`Login failed: ${error.message}`);
      }
    }
  }

  // Logout function
  function logout() {
    setUserRole(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminUser');
    return signOut(auth);
  }

  // Get user role
  async function getUserRole(uid) {
    try {
      console.log('Getting user role for UID:', uid);
      console.log('Current user:', currentUser);
      console.log('Auth state:', auth.currentUser);
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.log('No authenticated user found');
        return null;
      }
      
      // Validate UID
      if (!uid || typeof uid !== 'string') {
        console.log('Invalid UID provided:', uid);
        return null;
      }
      
      const userRef = doc(db, 'users', uid);
      console.log('User ref created:', userRef.path);
      
      const userSnap = await getDoc(userRef);
      console.log('User snapshot:', userSnap.exists() ? 'exists' : 'does not exist');
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('User data:', userData);
        const role = userData.role;
        console.log('User role:', role);
        
        // Update the userRole state if we have a current user
        if (currentUser && currentUser.uid === uid) {
          setUserRole(role);
        }
        return role;
      } else {
        console.log('User document does not exist, creating default user document...');
        
        // Create a default user document if it doesn't exist
        const defaultUserData = {
          firstName: auth.currentUser.displayName?.split(' ')[0] || '',
          lastName: auth.currentUser.displayName?.split(' ')[1] || '',
          email: auth.currentUser.email,
          role: 'student', // Default role
          createdAt: new Date(),
          profilePictureUrl: auth.currentUser.photoURL || '',
          profilePictureBase64: '',
          bio: '',
          skills: [],
          interests: [],
          graduationYear: '',
          major: '',
          company: '',
          position: '',
          experience: '',
          location: '',
          phone: '',
          website: '',
          linkedin: '',
          github: '',
          twitter: '',
          instagram: '',
          facebook: '',
          youtube: '',
          tiktok: '',
          snapchat: '',
          discord: '',
          telegram: '',
          whatsapp: '',
          skype: '',
          zoom: '',
          teams: '',
          slack: '',
          other: ''
        };
        
        try {
          await setDoc(userRef, defaultUserData);
          console.log('Default user document created successfully');
          
          // Update the userRole state
          if (currentUser && currentUser.uid === uid) {
            setUserRole('student');
          }
          return 'student';
        } catch (createError) {
          console.error('Error creating user document:', createError);
          console.error('Create error details:', createError.code, createError.message);
          // Return 'student' as default even if creation fails
          return 'student';
        }
      }
    } catch (error) {
      console.error('Error getting user role:', error);
      console.error('Error details:', error.code, error.message);
      console.error('Full error object:', error);
      
      // Return a default role instead of null to prevent crashes
      console.log('Returning default student role due to error');
      return 'student';
    }
  }

  // Refresh user role (useful after Google auth)
  async function refreshUserRole() {
    if (currentUser) {
      const role = await getUserRole(currentUser.uid);
      setUserRole(role);
      return role;
    }
    return null;
  }

  // Google authentication function using redirect
  async function signInWithGoogle(additionalData = {}) {
    try {
      console.log('Starting Google authentication with redirect');
      setIsGoogleAuth(true); // Set flag for Google authentication
      
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
      
      // Note: The actual result handling will be done in useEffect with getRedirectResult
      return { success: true, redirecting: true };
    } catch (error) {
      console.error('Google sign-in redirect error:', error);
      setIsGoogleAuth(false); // Reset flag on error
      throw error;
    }
  }

  // Handle Google redirect result
  async function handleGoogleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        console.log('Google redirect result received:', result.user.uid);
        setIsGoogleAuth(true); // Set flag for Google authentication

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
            firstName: result.user.displayName?.split(' ')[0] || '',
            lastName: result.user.displayName?.split(' ')[1] || '',
            bio: '',
            skills: [],
            interests: [],
            graduationYear: '',
            major: '',
            company: '',
            position: '',
            experience: '',
            location: '',
            phone: '',
            website: '',
            linkedin: '',
            github: '',
            twitter: '',
            instagram: '',
            facebook: '',
            youtube: '',
            tiktok: '',
            snapchat: '',
            discord: '',
            telegram: '',
            whatsapp: '',
            skype: '',
            zoom: '',
            teams: '',
            slack: '',
            other: ''
          };
          await setDoc(userRef, newUser);
          console.log('Google user created in Firestore');
        } else {
          console.log('Google user already exists in Firestore');
        }

        return { success: true, user: result.user };
      }
      setIsGoogleAuth(false); // Reset flag if no Google user
      return null;
    } catch (error) {
      console.error('Error handling Google redirect result:', error);
      setIsGoogleAuth(false); // Reset flag on error
      throw error;
    }
  }


  // Handle Google redirect result on component mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await handleGoogleRedirectResult();
        if (result && result.success) {
          console.log('Google authentication completed via redirect:', result);
          // The onAuthStateChanged will handle the rest
        }
      } catch (error) {
        console.error('Error handling Google redirect result:', error);
      }
    };

    handleRedirectResult();
  }, []);

  // Navigation callback for Google authentication
  const [navigationCallback, setNavigationCallback] = useState(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [isRegistration, setIsRegistration] = useState(false);

  // Navigation effect for Google authentication only (not registration)
  useEffect(() => {
    if (currentUser && userRole && !loading && navigationCallback && isGoogleAuth && !isRegistration) {
      console.log('User authenticated via Google, executing navigation callback');
      
      // Small delay to ensure state is fully updated
      setTimeout(() => {
        if (userRole === 'student') {
          navigationCallback('/student-dashboard');
        } else if (userRole === 'alumni') {
          navigationCallback('/alumni-dashboard');
        } else if (userRole === 'admin') {
          navigationCallback('/admin-dashboard');
        } else {
          navigationCallback('/student-dashboard'); // Default fallback
        }
        
        // Clear the callback after use
        setNavigationCallback(null);
        setIsGoogleAuth(false);
      }, 1000);
    }
  }, [currentUser, userRole, loading, navigationCallback, isGoogleAuth, isRegistration]);

  useEffect(() => {
    let isMounted = true;
    
    // Check for stored authentication data on mount
    const checkStoredAuth = () => {
      const storedRole = localStorage.getItem('userRole');
      const storedUser = localStorage.getItem('adminUser');
      
      console.log('Checking stored auth data:', {
        storedRole,
        storedUser: storedUser ? 'exists' : 'null'
      });
      
      if (storedUser && storedRole) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Restoring user from localStorage:', userData.uid);
          setCurrentUser(userData);
          setUserRole(storedRole);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('userRole');
          localStorage.removeItem('adminUser');
        }
      }
    };
    
    // Check stored auth first
    checkStoredAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      console.log('Firebase auth state changed:', user ? `User: ${user.uid}` : 'No user');
      
      try {
        if (user) {
          // User is signed in
          console.log('Auth state changed - user authenticated:', user.uid);
          console.log('User email:', user.email);
          console.log('User email verified:', user.emailVerified);
          
          const profileData = await fetchUserProfile(user.uid);
          console.log('Fetched profile data:', profileData);
          
          if (isMounted) {
            const userWithProfile = { ...user, ...profileData };
            setCurrentUser(userWithProfile);
            
            const role = profileData?.role || 'student';
            setUserRole(role);
            
            // Update localStorage with fresh data
            localStorage.setItem('userRole', role);
            localStorage.setItem('adminUser', JSON.stringify(userWithProfile));
            
            console.log('User state updated:', {
              uid: userWithProfile.uid,
              email: userWithProfile.email,
              role: role
            });
          }
        } else {
          // User is signed out
          console.log('Auth state changed - user not authenticated');
          console.log('Clearing user state and localStorage');
          
          if (isMounted) {
            setCurrentUser(null);
            setUserRole(null);
          }
          
          // Clear localStorage
          localStorage.removeItem('userRole');
          localStorage.removeItem('adminUser');
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth state change:', error);
      }
    };
  }, []);

  // Debug function to check authentication state
  const debugAuthState = () => {
    console.group('🔍 Current Authentication State');
    console.log('Current User:', currentUser);
    console.log('User Role:', userRole);
    console.log('Loading:', loading);
    console.log('Firebase Auth Current User:', auth.currentUser);
    console.log('LocalStorage userRole:', localStorage.getItem('userRole'));
    console.log('LocalStorage adminUser:', localStorage.getItem('adminUser'));
    console.groupEnd();
  };

  // Function to set navigation callback for Google auth
  const setGoogleAuthNavigationCallback = (callback) => {
    setNavigationCallback(() => callback);
  };

  // Function to reset Google auth flag
  const resetGoogleAuthFlag = () => {
    setIsGoogleAuth(false);
  };

  // Function to reset registration flag
  const resetRegistrationFlag = () => {
    setIsRegistration(false);
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
    handleGoogleRedirectResult,
    setGoogleAuthNavigationCallback,
    resetGoogleAuthFlag,
    resetRegistrationFlag,
    debugAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
