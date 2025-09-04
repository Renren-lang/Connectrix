import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner.jsx';
import SafeLogger from '../utils/logger';

function ProtectedRoute({ children, allowedRoles = ['student', 'alumni'], redirectTo = '/login' }) {
  const { currentUser, userRole, loading, getUserRole } = useAuth();
  const [roleLoading, setRoleLoading] = useState(false);
  const [hasCheckedRole, setHasCheckedRole] = useState(false);

  // Debug logging
  SafeLogger.log('ProtectedRoute: currentUser:', currentUser?.uid, 'userRole:', userRole, 'allowedRoles:', allowedRoles);
  SafeLogger.log('ProtectedRoute: localStorage userRole:', localStorage.getItem('userRole'));

  // Check if we need to fetch user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (currentUser && !userRole && !hasCheckedRole && !roleLoading) {
        setRoleLoading(true);
        setHasCheckedRole(true);
        
        try {
          SafeLogger.log('ProtectedRoute: Fetching user role for:', currentUser.uid);
          const fetchedRole = await getUserRole(currentUser.uid);
          SafeLogger.log('ProtectedRoute: Fetched role:', fetchedRole);
          
          // If we still don't have a role after fetching, wait a bit more
          if (!fetchedRole) {
            SafeLogger.log('ProtectedRoute: No role found, waiting for user data to be created...');
            // Wait 2 seconds and try again
            setTimeout(() => {
              setHasCheckedRole(false);
              setRoleLoading(false);
            }, 2000);
            return;
          }
        } catch (error) {
          SafeLogger.error('ProtectedRoute: Error fetching user role:', error);
        } finally {
          setRoleLoading(false);
        }
      }
    };

    checkUserRole();
  }, [currentUser, userRole, hasCheckedRole, roleLoading, getUserRole]);

  // Show loading while checking authentication or user role
  if (loading || roleLoading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  // If we have a user but no role yet, check localStorage as fallback
  if (currentUser && !userRole && !hasCheckedRole) {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      SafeLogger.log('ProtectedRoute: Using stored role from localStorage:', storedRole);
      // If we have a stored role, allow access
      if (allowedRoles.includes(storedRole)) {
        return children;
      } else {
        // Redirect to appropriate dashboard based on stored role
        if (storedRole === 'alumni') {
          return <Navigate to="/alumni-dashboard" replace />;
        } else {
          return <Navigate to="/student-dashboard" replace />;
        }
      }
    }
    return <LoadingSpinner />;
  }

  // If user role is not in allowed roles, redirect to appropriate dashboard
  if (userRole && !allowedRoles.includes(userRole)) {
    SafeLogger.log('ProtectedRoute: User role', userRole, 'not in allowed roles', allowedRoles);
    if (userRole === 'alumni') {
      SafeLogger.log('ProtectedRoute: Redirecting to alumni dashboard');
      return <Navigate to="/alumni-dashboard" replace />;
    } else {
      SafeLogger.log('ProtectedRoute: Redirecting to student dashboard');
      return <Navigate to="/student-dashboard" replace />;
    }
  }

  // If authenticated and role is allowed, render children
  return children;
}

export default ProtectedRoute;
