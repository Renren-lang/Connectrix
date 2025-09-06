import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
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
        role: role,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        batch: userData.batch || '',
        course: userData.course || '',
        goals: userData.goals || '',
        experience: userData.experience || '',
        skills: userData.skills || '',
        willingToMentor: userData.willingToMentor || false,
        createdAt: new Date(),
        ...userData
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Login function
  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user role from Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const role = userSnap.data().role;
        setUserRole(role);
        // Also store role in localStorage for persistence
        localStorage.setItem('userRole', role);
      } else {
        // If no user document exists, this is an error
        throw new Error('User profile not found. Please contact support.');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Logout function
  function logout() {
    setUserRole(null);
    localStorage.removeItem('userRole');
    return signOut(auth);
  }

  // Get user role
  async function getUserRole(uid) {
    try {
      console.log('Getting user role for UID:', uid);
      console.log('Current user:', currentUser);
      console.log('Auth state:', auth.currentUser);
      
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
      }
      console.log('User document does not exist');
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      console.error('Error details:', error.code, error.message);
      return null;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Fetch user profile data from Firestore
          const profileData = await fetchUserProfile(user.uid);
          
          // Combine Firebase Auth user with Firestore profile data
          const userWithProfile = {
            ...user,
            ...profileData
          };
          
          setCurrentUser(userWithProfile);
          
          // Get user role when auth state changes
          const role = await getUserRole(user.uid);
          console.log('AuthContext: Fetched user role:', role, 'for user:', user.uid);
          
          // Also check localStorage for role persistence (especially for new users)
          const storedRole = localStorage.getItem('userRole');
          console.log('AuthContext: Stored role from localStorage:', storedRole);
          
          // Use stored role if available, otherwise use fetched role
          const finalRole = storedRole || role;
          console.log('AuthContext: Setting final role:', finalRole);
          setUserRole(finalRole);
        } else {
          setCurrentUser(null);
          setUserRole(null);
          localStorage.removeItem('userRole');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // Handle error gracefully - set user to null but don't crash
        setCurrentUser(null);
        setUserRole(null);
        localStorage.removeItem('userRole');
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
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
