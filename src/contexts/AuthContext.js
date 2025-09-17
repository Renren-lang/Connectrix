import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
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
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Return null instead of throwing to prevent crashes
      return null;
    }
  }

  // Update user profile in Firestore
  async function updateUserProfile(uid, profileData) {
    try {
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
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      await updateProfile(result.user, {
        displayName: userData.firstName || email.split('@')[0]
      });

      // Store additional user data in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        email: email,
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
        willingToMentor: userData.willingToMentor || false,
        createdAt: new Date(),
        ...userData
      });

      // Store role and user data in localStorage for persistence
      localStorage.setItem('userRole', role);
      localStorage.setItem('adminUser', JSON.stringify(result.user));

      return result;
    } catch (error) {
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
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else {
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

  // Google authentication function using popup
  async function signInWithGoogle(role = 'student', additionalData = {}) {
    try {
      console.log('Starting Google authentication with role:', role);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      console.log('Google popup result received:', result.user.uid);
      
      // Create user data
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: role,
        ...additionalData
      };

      // Save to Firestore
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        ...userData,
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
      });
      
      // Save to localStorage for persistence
      localStorage.setItem('userRole', role);
      localStorage.setItem('adminUser', JSON.stringify(result.user));
      
      console.log('Google user data saved successfully');
      
      return { success: true, user: result.user, role: role };
    } catch (error) {
      console.error('Google authentication error:', error);
      throw error;
    }
  }


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        // Check for admin user first, but only if there's no Firebase user
        const adminUser = localStorage.getItem('adminUser');
        const storedRole = localStorage.getItem('userRole');
        
        // Only treat as admin if there's no Firebase user AND admin data exists
        if (!user && adminUser && storedRole === 'admin') {
          try {
            const adminData = JSON.parse(adminUser);
            console.log('AuthContext: Admin user detected from localStorage (no Firebase user)');
            setCurrentUser(adminData);
            setUserRole('admin');
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing admin user data:', error);
            localStorage.removeItem('adminUser');
            localStorage.removeItem('userRole');
          }
        }

        if (user) {
          console.log('Auth state changed - user authenticated:', user.uid);
          console.log('User email:', user.email);
          console.log('User displayName:', user.displayName);
          
          // Clear admin data if Firebase user is authenticated
          if (storedRole === 'admin') {
            console.log('Clearing admin data - Firebase user authenticated');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('userRole');
          }
          
          // Set current user immediately to prevent timing issues
          setCurrentUser(user);
          
          // Fetch user profile data from Firestore
          console.log('Fetching user profile from Firestore...');
          const profileData = await fetchUserProfile(user.uid);
          console.log('Profile data fetched:', profileData);
          
          // Combine Firebase Auth user with Firestore profile data
          const userWithProfile = {
            ...user,
            ...profileData
          };
          
          setCurrentUser(userWithProfile);
          
          // Get user role when auth state changes
          console.log('Getting user role from Firestore...');
          const role = await getUserRole(user.uid);
          console.log('AuthContext: Fetched user role:', role, 'for user:', user.uid);
          
          // Also check localStorage for role persistence (especially for new users)
          const currentStoredRole = localStorage.getItem('userRole');
          console.log('AuthContext: Stored role from localStorage:', currentStoredRole);
          
          // Use stored role if available, otherwise use fetched role, default to 'student'
          const finalRole = currentStoredRole || role || 'student';
          console.log('AuthContext: Setting final role:', finalRole);
          setUserRole(finalRole);
          
          // Store role in localStorage for persistence
          localStorage.setItem('userRole', finalRole);
          console.log('Role stored in localStorage:', finalRole);
          
          // Ensure user stays authenticated
          console.log('User authentication completed successfully');
        } else {
          console.log('Auth state changed - user not authenticated');
          console.log('Current storedRole:', storedRole);
          console.log('Current adminUser:', adminUser);
          
          // Fallback to stored values instead of clearing immediately
          if (storedRole) {
            console.log('No Firebase user, but using stored role:', storedRole);
            setUserRole(storedRole);
            if (adminUser && storedRole === 'admin') {
              try {
                const adminData = JSON.parse(adminUser);
                setCurrentUser(adminData);
                console.log('Restored admin user from localStorage');
              } catch (error) {
                console.error('Error parsing admin user data:', error);
                localStorage.removeItem('adminUser');
                localStorage.removeItem('userRole');
                setCurrentUser(null);
                setUserRole('student'); // Default role
              }
            } else if (adminUser && storedRole !== 'admin') {
              try {
                const userData = JSON.parse(adminUser);
                setCurrentUser(userData);
                console.log('Restored user from localStorage');
              } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('adminUser');
                localStorage.removeItem('userRole');
                setCurrentUser(null);
                setUserRole('student'); // Default role
              }
            } else {
              // No stored user data, but we have a role
              setCurrentUser(null);
              console.log('Using stored role without user data');
            }
          } else {
            console.log('Clearing user data - no stored role');
            setCurrentUser(null);
            setUserRole('student'); // Default to student instead of null
            localStorage.removeItem('userRole');
            localStorage.removeItem('adminUser');
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // Handle error gracefully - set user to null but don't crash
        setCurrentUser(null);
        setUserRole('student'); // Default to student role instead of null
        // Don't clear localStorage on error - keep stored data for recovery
        console.log('Error occurred, keeping stored data for recovery');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout,
    getUserRole,
    refreshUserRole,
    updateUserProfile,
    fetchUserProfile,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
