import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header.jsx';
import YouTubeStyleLayout from './components/YouTubeStyleLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotificationSettings from './pages/NotificationSettings.jsx';
import Notifications from './pages/Notifications.jsx';
import AlumniDashboard from './pages/AlumniDashboardNew.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import Events from './pages/Events.jsx';
import Forum from './pages/Forum.jsx';
import MentorshipMatching from './pages/MentorshipMatching.jsx';
import Messaging from './pages/Messaging.jsx';
import Profile from './pages/Profile.jsx';
import BrowseMentor from './pages/BrowseMentor.jsx';
import StudentProfiles from './pages/StudentProfiles.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AuthDebugger from './components/AuthDebugger.jsx';
import { Debug400Errors } from './utils/debug400Errors';



function AppContent() {
  const location = useLocation();

  // Start 400 error monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      Debug400Errors.startMonitoring();
      console.log('🔍 400 Error monitoring enabled in development mode');
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        Debug400Errors.stopMonitoring();
      }
    };
  }, []);
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Get current page name for sidebar highlighting
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('mentor')) return 'Mentors';
    if (path.includes('forum')) return 'Forum';
    if (path.includes('events')) return 'Events';
    if (path.includes('settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="App">
      <AuthDebugger />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Protected Routes */}
        <Route path="/notification-settings" element={
          <ProtectedRoute>
            <Header />
            <NotificationSettings />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <Notifications />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/alumni-dashboard" element={
          <ProtectedRoute allowedRoles={['alumni']}>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <AlumniDashboard />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <StudentDashboard />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <Events />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/forum" element={
          <ProtectedRoute>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <Forum />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/mentorship" element={
          <ProtectedRoute>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <MentorshipMatching />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/messaging" element={
          <ProtectedRoute>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <Messaging />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/student-profiles" element={
          <ProtectedRoute allowedRoles={['alumni']}>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <StudentProfiles />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/browse-mentor" element={
          <ProtectedRoute>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <BrowseMentor />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile/:userId" element={
          <ProtectedRoute>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <Profile />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <YouTubeStyleLayout currentPage={getCurrentPage()}>
              <Profile />
            </YouTubeStyleLayout>
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PostsProvider>
          <Router>
            <AppContent />
          </Router>
        </PostsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
