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
  SafeLogger.log('ProtectedRoute: loading:', loading, 'roleLoading:', roleLoading, 'hasCheckedRole:', hasCheckedRole);
  SafeLogger.log('ProtectedRoute: current path:', window.location.pathname);

  // Simplified role checking
  useEffect(() => {
    const checkUserRole = async () => {
      if (currentUser && !userRole && !hasCheckedRole && !roleLoading) {
        setRoleLoading(true);
        setHasCheckedRole(true);
        
        try {
          SafeLogger.log('ProtectedRoute: Fetching user role for:', currentUser.uid);
          const fetchedRole = await getUserRole(currentUser.uid);
          SafeLogger.log('ProtectedRoute: Fetched role:', fetchedRole);
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
  if (currentUser && !userRole) {
    const storedRole = localStorage.getItem('userRole');
    SafeLogger.log('ProtectedRoute: No userRole in state, checking localStorage:', storedRole);
    
    if (storedRole) {
      SafeLogger.log('ProtectedRoute: Using stored role from localStorage:', storedRole);
      // If we have a stored role, allow access
      if (allowedRoles.includes(storedRole)) {
        return children;
      } else {
        // Redirect to appropriate dashboard based on stored role
        if (storedRole === 'admin') {
          return <Navigate to="/admin-dashboard" replace />;
        } else if (storedRole === 'alumni') {
          return <Navigate to="/alumni-dashboard" replace />;
        } else {
          return <Navigate to="/student-dashboard" replace />;
        }
      }
    } else {
      // No stored role, but we have a user - assume student role
      SafeLogger.log('ProtectedRoute: No stored role, assuming student role');
      if (allowedRoles.includes('student')) {
        return children;
      } else {
        return <Navigate to="/student-dashboard" replace />;
      }
    }
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
