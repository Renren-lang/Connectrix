import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImage from '../components/Logo2.png';

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Admin credentials (in production, this should be stored securely)
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
    email: 'admin@connectrix.com'
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
      username: '',
      password: ''
    });

    // Validate inputs
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Check admin credentials directly (no Firebase lookup needed)
      if (formData.username === ADMIN_CREDENTIALS.username && 
          formData.password === ADMIN_CREDENTIALS.password) {
        
        // Create a mock admin user for the session
        const adminUser = {
          uid: 'admin-uid-' + Date.now(),
          email: ADMIN_CREDENTIALS.email,
          displayName: 'Admin',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User'
        };

        // Store admin role and user data in localStorage
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        
        // Force a page reload to trigger the auth context update
        window.location.href = '/admin-dashboard';
      } else {
        setErrors({
          username: '',
          password: 'Invalid admin credentials'
        });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrors({
        username: '',
        password: 'An error occurred during login'
      });
    } finally {
      setIsSubmitting(false);
    }
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
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(185, 28, 28, 0.6) 100%)',
          zIndex: 1
        }}></div>

        {/* Header */}
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: '80px',
          padding: '0 5%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
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
                e.target.style.color = '#dc2626';
                e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
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
            />
            <span style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#dc2626',
              letterSpacing: '-0.5px',
              textTransform: 'uppercase'
            }}>CONNECTRIX ADMIN</span>
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
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                padding: '50px 40px',
                textAlign: 'center',
                position: 'relative',
                borderRadius: '20px 20px 0 0',
                color: 'white'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 20px auto',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px'
                }}>
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h1 style={{
                  fontSize: '42px',
                  fontWeight: '800',
                  margin: '0 0 10px 0',
                  letterSpacing: '2px'
                }}>ADMIN LOGIN</h1>
                <p style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  margin: 0,
                  opacity: 0.9
                }}>Access Admin Dashboard</p>
              </div>

              <div style={{
                padding: '40px 30px',
                background: 'white'
              }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="admin-username" style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                      color: '#374151',
                      fontSize: '14px'
                    }}>Admin Username</label>
                    <input
                      type="text"
                      id="admin-username"
                      name="username"
                      style={{
                        width: '100%',
                        padding: '15px 20px',
                        border: `1px solid ${errors.username ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'white',
                        color: '#333',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      placeholder="Enter admin username"
                      value={formData.username}
                      onChange={handleInputChange}
                      autoComplete="username"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#dc2626';
                        e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.username ? '#ef4444' : '#d1d5db';
                        e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                      }}
                    />
                    {errors.username && (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '14px',
                        marginTop: '5px'
                      }}>{errors.username}</div>
                    )}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="admin-password" style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                      color: '#374151',
                      fontSize: '14px'
                    }}>Admin Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="admin-password"
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
                        placeholder="Enter admin password"
                        value={formData.password}
                        onChange={handleInputChange}
                        autoComplete="current-password"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#dc2626';
                          e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
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

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                    disabled={isSubmitting}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                      }
                    }}
                  >
                    {isSubmitting ? 'Signing in...' : 'Access Admin Dashboard'}
                  </button>
                </form>

                <div style={{
                  textAlign: 'center',
                  marginTop: '30px',
                  padding: '20px',
                  background: 'rgba(220, 38, 38, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(220, 38, 38, 0.1)'
                }}>
                  <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>
                    <strong>Default Admin Credentials:</strong>
                  </div>
                  <div style={{ color: '#dc2626', fontSize: '12px', fontFamily: 'monospace' }}>
                    Username: admin<br />
                    Password: admin123
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
