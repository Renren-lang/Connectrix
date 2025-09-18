import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import SafeLogger from '../utils/logger';
import API_CONFIG from '../config/api';
import { debugAuthError, debugLoginAttempt, validateEmail, validatePassword as validatePasswordUtil } from '../utils/authDebugger';
import logoImage from '../components/Logo2.png';
import PopupInstructions from '../components/PopupInstructions';

function Login() {
  const navigate = useNavigate();
  const { currentUser, userRole, loading, login, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isRegistrationRedirect, setIsRegistrationRedirect] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [googleSelectedRole, setGoogleSelectedRole] = useState('');
  const [showPopupInstructions, setShowPopupInstructions] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [googleFormData, setGoogleFormData] = useState({
    batch: '',
    course: '',
    goals: '',
    experience: '',
    skills: '',
    willingToMentor: false
  });
  const [selectedRoleBeforeAuth, setSelectedRoleBeforeAuth] = useState('');
  const [showAuthConfirmation, setShowAuthConfirmation] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check for stored role on component mount
  useEffect(() => {
    const storedRole = localStorage.getItem('selectedRole');
    if (storedRole) {
      setSelectedRoleBeforeAuth(storedRole);
    }
  }, []);


  // Check if this is a registration redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromRegistration = urlParams.get('from') === 'registration';
    if (fromRegistration) {
      setIsRegistrationRedirect(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check if user is already authenticated and redirect (only if not showing success message)
  useEffect(() => {
    console.log('Login useEffect - loading:', loading, 'currentUser:', !!currentUser, 'userRole:', userRole, 'showSuccess:', showSuccess);
    
    if (!loading && currentUser && userRole && !showSuccess) {
      console.log('User already authenticated, redirecting from login page');
      console.log('Redirecting to:', userRole === 'student' ? '/student-dashboard' : '/alumni-dashboard');
      if (userRole === 'student') {
        navigate('/student-dashboard');
      } else if (userRole === 'alumni') {
        navigate('/alumni-dashboard');
      }
    }
  }, [currentUser, userRole, loading, navigate, showSuccess]);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);



  // Helper function to look up email from username
  const lookupEmailFromUsername = async (username) => {
    try {
      // Check if input is an email (contains @)
      if (username.includes('@')) {
        return username; // Return as-is if it's an email
      }
      
      // Look up username in Firestore to get the email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        console.log('Found user with username:', username, 'Email:', userData.email);
        return userData.email;
      } else {
        console.log('No user found with username:', username);
        return null;
      }
    } catch (error) {
      console.error('Error looking up email from username:', error);
      return null;
    }
  };

  // Validation functions
  const validateUsername = (input) => {
    const trimmed = input.trim();
    // Allow both emails and usernames
    if (trimmed.includes('@')) {
      const emailValidation = validateEmail(trimmed);
      return emailValidation.isValid;
    }
    // Username validation - must be at least 3 characters
    return trimmed.length >= 3;
  };

  const validatePassword = (password) => {
    const passwordValidation = validatePasswordUtil(password);
    return passwordValidation.isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Clear previous errors
    setErrors({
      email: '',
      password: ''
    });

    // Validate inputs
    const newErrors = {};
    if (!validateUsername(formData.email)) {
      newErrors.email = 'Please enter a valid username or email';
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Debug login attempt
      const debugInfo = debugLoginAttempt(formData.email, formData.password);
      console.log('Login attempt debug info:', debugInfo);
      

      // Look up email from username if needed
      const email = await lookupEmailFromUsername(formData.email);
      if (!email) {
        setErrors({
          email: 'Please enter a valid username or email',
          password: ''
        });
        setIsSubmitting(false);
        return;
      }

      // Attempt to login with the found email
      const result = await login(email, formData.password);
      
      // If we get here, login was successful
      setShowSuccess(true);
      setTimeout(() => {
        // The user will be automatically redirected by the useEffect
        // that checks currentUser and userRole
        console.log('Login successful, user will be redirected automatically');
      }, 1500);
    } catch (error) {
      // Debug the authentication error
      debugAuthError(error, 'Login');
      
      // Handle specific Firebase Auth errors with user-friendly messages
      if (error.code === 'auth/invalid-credential') {
        setErrors({
          username: '',
          password: 'Invalid username or password. Please check your credentials and try again.'
        });
      } else if (error.code === 'auth/user-not-found') {
        setErrors({
          username: 'No account found with this username',
          password: ''
        });
      } else if (error.code === 'auth/wrong-password') {
        setErrors({
          username: '',
          password: 'Incorrect password. Please try again.'
        });
      } else if (error.code === 'auth/invalid-email') {
        setErrors({
          username: 'Invalid username format',
          password: ''
        });
      } else if (error.code === 'auth/user-disabled') {
        setErrors({
          username: '',
          password: 'This account has been disabled. Please contact support.'
        });
      } else if (error.code === 'auth/too-many-requests') {
        setErrors({
          username: '',
          password: 'Too many failed login attempts. Please try again later.'
        });
      } else if (error.code === 'auth/network-request-failed') {
        setErrors({
          username: '',
          password: 'Network error. Please check your internet connection.'
        });
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrors({
          username: '',
          password: 'Username/password authentication is not enabled. Please contact support.'
        });
      } else {
        setErrors({
          username: '',
          password: error.message || 'An unexpected error occurred during login'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      setShowRoleSelection(true);
    } catch (error) {
      console.error('Google login error:', error);
      setErrors({
        email: '',
        password: 'Google login failed'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRoleSelect = (role) => {
    console.log('🎯 Role selected:', role);
    setGoogleSelectedRole(role);
    setShowAuthConfirmation(true);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordMessage('Please enter your email address');
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      setForgotPasswordMessage('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail);
      setForgotPasswordMessage('Password reset email sent! Check your inbox.');
      setForgotPasswordEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        setForgotPasswordMessage('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setForgotPasswordMessage('Invalid email address');
      } else {
        setForgotPasswordMessage('Failed to send reset email. Please try again.');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleConfirmGoogleAuth = async () => {
    try {
      setIsSubmitting(true);
      
      // Store the selected role in the form data
      const authData = {
        ...googleFormData,
        role: googleSelectedRole
      };
      
      console.log('🔍 Starting Google auth with role:', googleSelectedRole);
      console.log('🔍 Auth data:', authData);
      
      // Use AuthContext Google auth function (popup method)
      const result = await signInWithGoogle(authData);
      
      if (result.success) {
        console.log('✅ Google popup authentication successful');
        console.log('✅ Selected role:', googleSelectedRole);
        
        // Redirect immediately based on role - no delay, no success message
        const selectedRole = googleSelectedRole || 'student';
        console.log('🚀 Redirecting to dashboard for role:', selectedRole);
        
        // Use window.location.href for immediate redirect
        if (selectedRole === 'student') {
          console.log('🎓 Redirecting to student dashboard');
          window.location.href = '/student-dashboard';
        } else if (selectedRole === 'alumni') {
          console.log('👔 Redirecting to alumni dashboard');
          window.location.href = '/alumni-dashboard';
        } else {
          console.log('🎓 Default redirect to student dashboard');
          window.location.href = '/student-dashboard';
        }
      }
      
    } catch (error) {
      console.error('❌ Google auth error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Show popup instructions if popup is blocked
      if (error.code === 'auth/popup-blocked' || 
          error.message?.includes('popup') || 
          error.message?.includes('blocked')) {
        setShowPopupInstructions(true);
        return;
      }
      
      // Handle specific Google Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('ℹ️ User closed the popup window');
        // Don't show error message, just reset the form
        setGoogleFormData({ email: '', password: '' });
        setGoogleSelectedRole('');
        setShowAuthConfirmation(false);
        return;
      } else if (error.code === 'auth/popup-blocked') {
        setErrors({
          email: '',
          password: 'Popup was blocked by your browser. Please allow popups and try again.'
        });
      } else if (error.code === 'auth/cancelled-popup-request') {
        setErrors({
          email: '',
          password: 'Another sign-in process is already in progress. Please wait.'
        });
      } else if (error.message === 'Sign-in timed out. Please try again.') {
        setErrors({
          email: '',
          password: 'Sign-in timed out. Please try again.'
        });
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setErrors({
          email: '',
          password: 'An account already exists with this email using a different sign-in method.'
        });
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrors({
          email: '',
          password: 'Google sign-in is not enabled. Please contact support.'
        });
      } else if (error.code === 'auth/network-request-failed') {
        setErrors({
          email: '',
          password: 'Network error. Please check your internet connection and try again.'
        });
      } else if (error.code === 'auth/too-many-requests') {
        setErrors({
          email: '',
          password: 'Too many attempts. Please wait a moment and try again.'
        });
      } else if (error.code === 'auth/invalid-credential') {
        setErrors({
          email: '',
          password: 'Invalid credentials. Please try again.'
        });
      } else if (error.code === 'auth/user-disabled') {
        setErrors({
          email: '',
          password: 'This account has been disabled. Please contact support.'
        });
      } else {
        setErrors({
          email: '',
          password: `Google authentication failed: ${error.message || 'Unknown error'}. Please try again.`
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelGoogleAuth = () => {
    setShowAuthConfirmation(false);
    setShowRoleSelection(false);
    setGoogleSelectedRole('');
    setGoogleFormData({
      batch: '',
      course: '',
      goals: '',
      experience: '',
      skills: '',
      willingToMentor: false
    });
  };

  const handleGoogleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGoogleFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        style={{
          backgroundImage: 'url(/assets/image.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.7) 0%, rgba(29, 78, 216, 0.5) 100%)',
          zIndex: 1
        }}></div>

        {/* Header */}
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: isScrolled ? '70px' : '80px',
          padding: '0 5%',
          background: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.1)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#2563eb';
                e.target.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#6b7280';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <i className="fas fa-arrow-left" style={{ fontSize: '16px' }}></i>
              Back to Home
            </button>
            <img 
              src={logoImage} 
              alt="Connectrix Logo" 
              style={{
                height: '50px',
                width: '50px',
                objectFit: 'cover',
                borderRadius: '12px',
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '4px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.08)';
                e.target.style.filter = 'drop-shadow(0 5px 10px rgba(0, 0, 0, 0.4)) brightness(1.2)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.filter = 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3)) brightness(1.1)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <span style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#2563eb',
              letterSpacing: '-0.5px',
              textTransform: 'uppercase'
            }}>CONNECTRIX</span>
          </div>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => navigate('/login')} 
              style={{
                background: '#2563eb',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '14px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.3)';
              }}
            >Login</button>
            <button 
              onClick={() => navigate('/register')} 
              style={{
                background: '#2563eb',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '14px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.3)';
              }}
            >Register</button>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 0 2rem 0',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              width: '100%'
            }}>
              <div style={{
                background: 'white',
                padding: '50px 40px',
                textAlign: 'center',
                position: 'relative',
                borderRadius: '20px 20px 0 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <img 
                  src={logoImage} 
                  alt="Connectrix Logo" 
                  style={{
                    height: '80px',
                    width: '80px',
                    objectFit: 'cover',
                    borderRadius: '16px',
                    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
                    marginBottom: '20px'
                  }}
                />
                <h1 style={{
                  color: '#2563eb',
                  fontSize: '42px',
                  fontWeight: '800',
                  margin: '0 0 10px 0',
                  letterSpacing: '2px'
                }}>CONNECTRIX</h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '18px',
                  fontWeight: '500',
                  margin: 0
                }}>Connecting Students & Alumni for Growth and Mentorship</p>
              </div>

              <div style={{
                padding: '40px 30px',
                background: 'white'
              }}>
                {showRoleSelection ? (
                  <>
                    {!googleSelectedRole && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          background: '#e3f2fd', 
                          border: '1px solid #2196f3', 
                          borderRadius: '8px', 
                          padding: '12px', 
                          marginBottom: '20px',
                          color: '#1976d2'
                        }}>
                          <strong>Welcome!</strong> Please choose your role to continue with Google.
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '20px',
                          justifyContent: 'center',
                          marginBottom: '20px'
                        }}>
                          <button
                            type="button"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '20px',
                              border: '2px solid #2563eb',
                              borderRadius: '12px',
                              background: 'white',
                              color: '#2563eb',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              minWidth: '120px'
                            }}
                            onClick={() => handleGoogleRoleSelect('student')}
                            disabled={isSubmitting}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#2563eb';
                              e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'white';
                              e.target.style.color = '#2563eb';
                            }}
                          >
                            <i className="fas fa-graduation-cap" style={{ fontSize: '24px' }}></i>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>Student</h3>
                          </button>
                          
                          <button
                            type="button"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '20px',
                              border: '2px solid #2563eb',
                              borderRadius: '12px',
                              background: 'white',
                              color: '#2563eb',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              minWidth: '120px'
                            }}
                            onClick={() => handleGoogleRoleSelect('alumni')}
                            disabled={isSubmitting}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#2563eb';
                              e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'white';
                              e.target.style.color = '#2563eb';
                            }}
                          >
                            <i className="fas fa-user-tie" style={{ fontSize: '24px' }}></i>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>Alumni</h3>
                          </button>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                          <button
                            type="button"
                            style={{
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '10px 20px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onClick={() => setShowRoleSelection(false)}
                            disabled={isSubmitting}
                          >
                            Back to Login
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Google Authentication Confirmation Dialog */}
                    {showAuthConfirmation && (
                      <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                      }}>
                        <div style={{
                          backgroundColor: 'white',
                          padding: '30px',
                          borderRadius: '10px',
                          maxWidth: '400px',
                          width: '90%',
                          textAlign: 'center',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                        }}>
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              margin: '0 auto 15px auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <svg width="48" height="48" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Google Authentication</h3>
                            <p style={{ margin: '0', color: '#666', lineHeight: '1.5' }}>
                              You are about to sign in with Google. 
                              You will be registered as <strong>{googleSelectedRole}</strong>.
                              This will open a popup window for secure authentication.
                            </p>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              style={{
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                minWidth: '100px'
                              }}
                              onClick={handleCancelGoogleAuth}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              style={{
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                minWidth: '100px'
                              }}
                              onClick={handleConfirmGoogleAuth}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Signing in...' : 'Continue'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    
                    <form onSubmit={handleSubmit}>
                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="login-username" style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '500',
                          color: '#374151',
                          fontSize: '14px'
                        }}>Username or Email</label>
                        <input
                          type="text"
                          id="login-username"
                          name="email"
                          style={{
                            width: '100%',
                            padding: '15px 20px',
                            border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                            borderRadius: '12px',
                            fontSize: '16px',
                            background: 'white',
                            color: '#333',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease',
                            outline: 'none'
                          }}
                          placeholder="Enter your username or email"
                          value={formData.email}
                          onChange={handleInputChange}
                          autoComplete="username"
                          onFocus={(e) => {
                            e.target.style.borderColor = '#2563eb';
                            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = errors.email ? '#ef4444' : '#d1d5db';
                            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                          }}
                        />
                        {errors.email && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '14px',
                            marginTop: '5px'
                          }}>{errors.email}</div>
                        )}
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="login-password" style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '500',
                          color: '#374151',
                          fontSize: '14px'
                        }}>Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showPassword ? "text" : "password"}
                            id="login-password"
                            name="password"
                            style={{
                              width: '100%',
                              padding: '15px 50px 15px 20px',
                              border: `1px solid ${errors.password ? '#ef4444' : '#d1d5db'}`,
                              borderRadius: '12px',
                              fontSize: '16px',
                              background: 'white',
                              color: '#333',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.3s ease',
                              outline: 'none'
                            }}
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleInputChange}
                            autoComplete="current-password"
                            onFocus={(e) => {
                              e.target.style.borderColor = '#2563eb';
                              e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = errors.password ? '#ef4444' : '#d1d5db';
                              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#666',
                              fontSize: '16px'
                            }}
                          >
                            {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                          </button>
                        </div>
                        {errors.password && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '14px',
                            marginTop: '5px'
                          }}>{errors.password}</div>
                        )}
                      </div>

                      {errors.general && (
                        <div style={{
                          color: '#ef4444',
                          fontSize: '14px',
                          marginBottom: '20px',
                          textAlign: 'center'
                        }}>{errors.general}</div>
                      )}

                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          padding: '15px',
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                          opacity: isSubmitting ? 0.7 : 1
                        }}
                        disabled={isSubmitting}
                        onMouseEnter={(e) => {
                          if (!isSubmitting) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubmitting) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                          }
                        }}
                      >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                      </button>
                    </form>

                    {/* Forgot Password Link */}
                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          cursor: 'pointer',
                          fontSize: '14px',
                          textDecoration: 'underline'
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      margin: '30px 0',
                      color: '#6b7280'
                    }}>
                      <div style={{
                        flex: 1,
                        height: '1px',
                        background: '#e5e7eb'
                      }}></div>
                      <span style={{
                        padding: '0 20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>OR</span>
                      <div style={{
                        flex: 1,
                        height: '1px',
                        background: '#e5e7eb'
                      }}></div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'white',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          color: '#3c4043',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          minHeight: '40px'
                        }}
                        onClick={handleGoogleLogin}
                        disabled={isSubmitting}
                        onMouseEnter={(e) => {
                          if (!isSubmitting) {
                            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                            e.target.style.backgroundColor = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubmitting) {
                            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            e.target.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>{isSubmitting ? 'Signing in...' : 'Sign in with Google'}</span>
                      </button>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      marginTop: '30px',
                      padding: '20px',
                      background: 'rgba(37, 99, 235, 0.05)',
                      borderRadius: '12px',
                      border: '1px solid rgba(37, 99, 235, 0.1)'
                    }}>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>Don't have an account? </span>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          textDecoration: 'underline'
                        }}
                        onClick={() => navigate('/register')}
                      >
                        Register
                      </button>
                    </div>

                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Popup Instructions Modal */}
      {showPopupInstructions && (
        <PopupInstructions 
          onClose={() => setShowPopupInstructions(false)} 
        />
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Reset Password</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666', lineHeight: '1.5' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '15px',
                  boxSizing: 'border-box'
                }}
                required
              />
              
              {forgotPasswordMessage && (
                <div style={{
                  marginBottom: '15px',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: forgotPasswordMessage.includes('sent') ? '#d1fae5' : '#fee2e2',
                  color: forgotPasswordMessage.includes('sent') ? '#065f46' : '#dc2626',
                  fontSize: '14px'
                }}>
                  {forgotPasswordMessage}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                    setForgotPasswordMessage('');
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    background: forgotPasswordLoading ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {forgotPasswordLoading ? 'Sending...' : 'Send Reset Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;