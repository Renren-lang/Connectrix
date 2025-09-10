import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotificationSettings from './pages/NotificationSettings.jsx';
import AlumniDashboard from './pages/AlumniDashboardNew.jsx';
import StudentDashboard from './pages/StudentDashboardNew.jsx';
import Events from './pages/Events.jsx';
import Forum from './pages/Forum.jsx';
import MentorshipMatching from './pages/MentorshipMatching.jsx';
import Messaging from './pages/Messaging.jsx';
import Profile from './pages/Profile.jsx';
import BrowseMentor from './pages/BrowseMentor.jsx';
import StudentProfiles from './pages/StudentProfiles.jsx';



function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="App">
      {!isLandingPage && !isAuthPage && <Header />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

              <Route path="/notification-settings" element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              } />
              <Route path="/alumni-dashboard" element={
                <ProtectedRoute allowedRoles={['alumni']}>
                  <AlumniDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student-dashboard" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              } />
              <Route path="/forum" element={
                <ProtectedRoute>
                  <Forum />
                </ProtectedRoute>
              } />
              <Route path="/mentorship" element={
                <ProtectedRoute>
                  <MentorshipMatching />
                </ProtectedRoute>
              } />
              <Route path="/messaging" element={
                <ProtectedRoute>
                  <Messaging />
                </ProtectedRoute>
              } />

              <Route path="/student-profiles" element={
                <ProtectedRoute allowedRoles={['alumni']}>
                  <StudentProfiles />
                </ProtectedRoute>
              } />
              <Route path="/browse-mentor" element={
                <ProtectedRoute>
                  <BrowseMentor />
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
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
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
