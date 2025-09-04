import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithPopup, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import SafeLogger from '../utils/logger';
import API_CONFIG from '../config/api';

function Login() {
  const navigate = useNavigate();
  const { login, getUserRole, refreshUserRole } = useAuth();
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
  const [googleUser, setGoogleUser] = useState(null);
  const [googleSelectedRole, setGoogleSelectedRole] = useState('');
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

  // Check for stored role on component mount
  useEffect(() => {
    const storedRole = localStorage.getItem('selectedRole');
    if (storedRole) {
      setSelectedRoleBeforeAuth(storedRole);
    }
  }, []);

  // Handle any remaining redirect results (for backward compatibility)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          SafeLogger.firebaseAuth('Google redirect login successful (legacy)', { uid: result.user.uid });
          // Handle legacy redirect result
          const userRole = await getUserRole(result.user.uid);
          
          if (userRole) {
            SafeLogger.userAction('Legacy redirect - existing user', { role: userRole });
            if (userRole === 'student') {
              navigate('/student-dashboard');
            } else if (userRole === 'alumni') {
              navigate('/alumni-dashboard');
            }
          } else {
            // Show role selection for legacy redirect
            setGoogleUser(result.user);
            setShowRoleSelection(true);
          }
        }
      } catch (error) {
        SafeLogger.firebaseError('Legacy redirect error', error);
        // Don't show errors for legacy redirects
      }
    };

    handleRedirectResult();
  }, [navigate, getUserRole]);

  // Validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
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

    let isValid = true;
    const newErrors = {};

    // Validate email
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate password
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (isValid) {
      setIsSubmitting(true);

      try {
        // Clear any previous errors
        setErrors({});

        // Attempt to login
        const result = await login(formData.email, formData.password);

        // Get the user role directly from the login result
        const userRole = await getUserRole(result.user.uid);

        setShowSuccess(true);

        // Redirect based on user role
        setTimeout(() => {
          if (userRole === 'alumni') {
            navigate('/alumni-dashboard');
          } else if (userRole === 'student') {
            navigate('/student-dashboard');
          } else {
            // Fallback for unknown roles
            navigate('/student-dashboard');
          }
        }, 1000);
      } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found') {
          newErrors.email = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
          newErrors.password = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
          newErrors.email = 'Invalid email format';
        } else if (error.code === 'auth/too-many-requests') {
          newErrors.general =
            'Too many failed attempts. Please try again later.';
        } else {
          newErrors.general =
            'Failed to login. Please check your credentials and try again.';
        }
        setErrors(newErrors);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleGoogleLogin = async () => {
    // Show role selection first instead of direct Google sign-in
    setShowRoleSelection(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      const provider = new GoogleAuthProvider();
      
      // Use popup instead of redirect to avoid bounce tracking warnings
      const result = await signInWithPopup(auth, provider);
      
      if (result?.user) {
        SafeLogger.firebaseAuth('Google popup login successful', { uid: result.user.uid });
        
        // Get the stored role
        const storedRole = localStorage.getItem('selectedRole');
        SafeLogger.log('Stored role from localStorage', storedRole);
        SafeLogger.log('Current user from result:', result.user.email);
        
        if (storedRole) {
          // Check if user already exists
          const userRole = await getUserRole(result.user.uid);
          
          if (userRole) {
            // Existing user, redirect to dashboard
            SafeLogger.userAction('Existing user redirecting to dashboard', { role: userRole });
            localStorage.removeItem('selectedRole');
            
            // Force a small delay to ensure AuthContext is updated
            setTimeout(() => {
              // Force reload the page to ensure AuthContext is properly updated
              window.location.href = userRole === 'alumni' ? '/alumni-dashboard' : '/student-dashboard';
            }, 1000);
          } else {
            // New user, save to Firestore
            const displayName = result.user.displayName || '';
            const nameParts = displayName.split(' ').filter(part => part.trim() !== '');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            const userData = {
              uid: result.user.uid,
              email: result.user.email,
              firstName: firstName,
              lastName: lastName,
              displayName: displayName,
              profilePicture: result.user.photoURL || '',
              role: storedRole,
              provider: 'google.com',
              createdAt: new Date(),
              updatedAt: new Date()
            };

            SafeLogger.apiCall('/api/users/google', 'POST', { role: storedRole, email: userData.email });
            
            try {
              const response = await fetch(API_CONFIG.getURL(API_CONFIG.endpoints.googleUser), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
              });
              
              if (response.ok) {
                SafeLogger.apiResponse('/api/users/google', response.status, { role: storedRole });
                SafeLogger.userAction('Google registration completed', { role: storedRole });
                
                // Store the role in localStorage for AuthContext to pick up
                localStorage.setItem('userRole', storedRole);
                
                // Clear the selected role from localStorage
                localStorage.removeItem('selectedRole');
                
                // Refresh the user role in AuthContext
                await refreshUserRole();
                
                // Force a small delay to ensure AuthContext is updated
                setTimeout(() => {
                  SafeLogger.userAction('Redirecting to dashboard after Google auth', { role: storedRole });
                  // Force reload the page to ensure AuthContext is properly updated
                  window.location.href = storedRole === 'alumni' ? '/alumni-dashboard' : '/student-dashboard';
                }, 1000);
              } else {
                SafeLogger.apiError('/api/users/google', { status: response.status });
                setErrors({ general: 'Failed to create user account. Please try again.' });
              }
            } catch (fetchError) {
              SafeLogger.apiError('/api/users/google', fetchError);
              setErrors({ general: 'Network error. Please check your connection and try again.' });
            }
          }
        } else {
          // No stored role, show role selection
          setGoogleUser(result.user);
          setShowRoleSelection(true);
        }
      }
    } catch (error) {
      SafeLogger.firebaseError('Google sign-in error', error);
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google authentication is not enabled. Please use email/password or contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Authentication was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by your browser. Please allow popups and try again.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRoleSelect = (role) => {
    SafeLogger.userAction('Role selected for Google auth', { role });
    setGoogleSelectedRole(role);
    setSelectedRoleBeforeAuth(role);
    localStorage.setItem('selectedRole', role);
    // Show confirmation dialog instead of immediate authentication
    setShowAuthConfirmation(true);
  };

  const handleConfirmGoogleAuth = () => {
    setShowAuthConfirmation(false);
    handleGoogleSignIn();
  };

  const handleCancelGoogleAuth = () => {
    setShowAuthConfirmation(false);
    setGoogleSelectedRole('');
    setSelectedRoleBeforeAuth('');
    localStorage.removeItem('selectedRole');
  };

  const handleGoogleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGoogleFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };


  return (
    <div
      style={{
        backgroundImage: 'url(/assets/image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        padding: '2rem 0',
        position: 'relative'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1
      }}></div>
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        overflow: 'hidden'
      }}>
        <div className="auth-container">
        <div className="auth-header">
          <h1>Connectrix</h1>
          <p>Connecting Students & Alumni for Growth and Mentorship</p>
        </div>

        <div className="auth-body">
          {showRoleSelection ? (
            <>
              {!googleSelectedRole && (
                <div className="role-selection">
                  <div className="info-message" style={{ 
                    background: '#e3f2fd', 
                    border: '1px solid #2196f3', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    marginBottom: '20px',
                    color: '#1976d2'
                  }}>
                    <strong>Welcome!</strong> Please choose your role to continue with Google.
                  </div>
                  <div className="role-options">
                    <button
                      type="button"
                      className="role-btn student"
                      onClick={() => handleGoogleRoleSelect('student')}
                      disabled={isSubmitting}
                    >
                      <i className="fas fa-graduation-cap"></i>
                      <h3>Student</h3>
                    </button>
                    
                    <button
                      type="button"
                      className="role-btn alumni"
                      onClick={() => handleGoogleRoleSelect('alumni')}
                      disabled={isSubmitting}
                    >
                      <i className="fas fa-user-tie"></i>
                      <h3>Alumni</h3>
                    </button>
                  </div>
                  <div className="role-selection-footer" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
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
                <div className="auth-confirmation-overlay" style={{
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
                  <div className="auth-confirmation-dialog" style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '10px',
                    maxWidth: '400px',
                    width: '90%',
                    textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                  }}>
                    <div style={{ marginBottom: '20px' }}>
                      <i className="fab fa-google" style={{ fontSize: '48px', color: '#4285f4', marginBottom: '15px' }}></i>
                      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Google Authentication</h3>
                      <p style={{ margin: '0', color: '#666', lineHeight: '1.5' }}>
                        You are about to sign in with Google as a <strong>{googleSelectedRole}</strong>. 
                        This will open a popup window for secure authentication.
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancelGoogleAuth}
                        disabled={isSubmitting}
                        style={{ minWidth: '100px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleConfirmGoogleAuth}
                        disabled={isSubmitting}
                        style={{ minWidth: '100px' }}
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
                <div className="form-group">
                  <label htmlFor="login-email">Email</label>
                                  <input
                  type="email"
                  id="login-email"
                  name="email"
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                />
                  {errors.email && (
                    <div className="error-message show">{errors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <div style={{ position: 'relative' }}>
                                      <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    name="password"
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={{ paddingRight: '45px' }}
                    autoComplete="current-password"
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
                    <div className="error-message show">{errors.password}</div>
                  )}
                </div>

                {errors.general && (
                  <div className="error-message show">{errors.general}</div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="divider">
                <span>OR</span>
              </div>

              <div className="social-login">
                <button
                  className="social-btn"
                  onClick={handleGoogleLogin}
                  type="button"
                  disabled={isSubmitting}
                >
                  <i className="fab fa-google"></i>
                  <span>{isSubmitting ? 'Signing in...' : 'Google'}</span>
                </button>
              </div>

              <div className="form-footer">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="link-button"
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
    );
}

export default Login;
