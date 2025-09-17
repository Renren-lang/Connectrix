import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import logoImage from '../components/Logo2.png';
import '../styles/responsive.css';

function Register() {
  const navigate = useNavigate();
  const { signup, currentUser, userRole, resetRegistrationFlag } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    schoolId: '',
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    batch: '',
    course: '',
    goals: '',
    experience: '',
    skills: '',
    willingToMentor: false
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'student') {
      setErrors(prev => ({
        ...prev,
        schoolId: '',
        batch: '',
        course: '',
        goals: ''
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        schoolId: '',
        experience: '',
        skills: ''
      }));
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!selectedRole) newErrors.role = 'Please select your role (Student or Alumni)';
    
    if (selectedRole === 'student') {
      if (!formData.schoolId.trim()) newErrors.schoolId = 'School ID number is required';
      if (!formData.batch.trim()) newErrors.batch = 'Batch year is required';
      if (!formData.course.trim()) newErrors.course = 'Course/Major is required';
      if (!formData.goals.trim()) newErrors.goals = 'Career goals are required';
    } else if (selectedRole === 'alumni') {
      if (!formData.experience.trim()) newErrors.experience = 'Work experience is required';
      if (!formData.skills.trim()) newErrors.skills = 'Skills are required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      await signup(formData.email, formData.password, selectedRole, formData);
      setShowSuccess(true);
      setTimeout(() => {
        setFormData({
          schoolId: '',
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          batch: '',
          course: '',
          goals: '',
          experience: '',
          skills: '',
          willingToMentor: false
        });
        setSelectedRole('');
        setErrors({});
        setShowSuccess(false);
        // Navigate to login page first
        navigate('/login?from=registration');
        // Reset registration flag after navigation
        setTimeout(() => {
          resetRegistrationFlag();
        }, 100);
      }, 2000);
    } catch (error) {
      console.error('Registration failed:', error);
      // Reset registration flag on error
      resetRegistrationFlag();
      if (error.code === 'auth/email-already-in-use') {
        newErrors.email = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        newErrors.password = 'Password is too weak';
      } else {
        newErrors.general = 'Failed to create account. Please try again.';
      }
      setErrors(newErrors);
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
                <div style={{
                  marginTop: '15px',
                  padding: '8px 20px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  borderRadius: '20px',
                  display: 'inline-block'
                }}>
                  <span style={{
                    color: '#2563eb',
                    fontSize: '14px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>REGISTRATION FORM</span>
                </div>
              </div>

              <div style={{
                padding: '40px 30px',
                background: 'white'
              }}>
                {showSuccess && (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#059669',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    Registration successful! Please check your email to verify your account.
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="register-first-name" style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>First Name</label>
                    <input
                      type="text"
                      id="register-first-name"
                      name="firstName"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box',
                        backgroundColor: errors.firstName ? '#fef2f2' : 'white',
                        borderColor: errors.firstName ? '#ef4444' : '#e5e7eb'
                      }}
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      autoComplete="given-name"
                    />
                    {errors.firstName && (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '12px',
                        marginTop: '4px',
                        fontWeight: '500'
                      }}>{errors.firstName}</div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="register-last-name" style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>Last Name</label>
                    <input
                      type="text"
                      id="register-last-name"
                      name="lastName"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box',
                        backgroundColor: errors.lastName ? '#fef2f2' : 'white',
                        borderColor: errors.lastName ? '#ef4444' : '#e5e7eb'
                      }}
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      autoComplete="family-name"
                    />
                    {errors.lastName && (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '12px',
                        marginTop: '4px',
                        fontWeight: '500'
                      }}>{errors.lastName}</div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="register-email">Email</label>
                    <input
                      type="email"
                      id="register-email"
                      name="email"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box',
                        backgroundColor: errors.email ? '#fef2f2' : 'white',
                        borderColor: errors.email ? '#ef4444' : '#e5e7eb'
                      }}
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '12px',
                        marginTop: '4px',
                        fontWeight: '500'
                      }}>{errors.email}</div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="register-username">Username</label>
                    <input
                      type="text"
                      id="register-username"
                      name="username"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box',
                        backgroundColor: errors.username ? '#fef2f2' : 'white',
                        borderColor: errors.username ? '#ef4444' : '#e5e7eb'
                      }}
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleInputChange}
                      autoComplete="username"
                    />
                    {errors.username && (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '12px',
                        marginTop: '4px',
                        fontWeight: '500'
                      }}>{errors.username}</div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="register-password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="register-password"
                        name="password"
                        style={{
                          width: '100%',
                          padding: '12px 45px 12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '16px',
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box',
                          backgroundColor: errors.password ? '#fef2f2' : 'white',
                          borderColor: errors.password ? '#ef4444' : '#e5e7eb'
                        }}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
                        autoComplete="new-password"
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
                        fontSize: '12px',
                        marginTop: '4px',
                        fontWeight: '500'
                      }}>{errors.password}</div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="register-confirm-password">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="register-confirm-password"
                        name="confirmPassword"
                        style={{
                          width: '100%',
                          padding: '12px 45px 12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '16px',
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box',
                          backgroundColor: errors.confirmPassword ? '#fef2f2' : 'white',
                          borderColor: errors.confirmPassword ? '#ef4444' : '#e5e7eb'
                        }}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                        {showConfirmPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '12px',
                        marginTop: '4px',
                        fontWeight: '500'
                      }}>{errors.confirmPassword}</div>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '14px'
                    }}>I am a:</label>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '20px'
                    }}>
                      <div
                        style={{
                          flex: 1,
                          padding: '15px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          backgroundColor: selectedRole === 'student' ? '#2563eb' : 'white',
                          borderColor: selectedRole === 'student' ? '#2563eb' : '#e5e7eb',
                          color: selectedRole === 'student' ? 'white' : '#374151'
                        }}
                        onClick={() => handleRoleSelect('student')}
                      >
                        <i className="fas fa-user-graduate" style={{
                          fontSize: '20px',
                          marginBottom: '8px',
                          display: 'block'
                        }}></i>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Student</h3>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          padding: '15px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          backgroundColor: selectedRole === 'alumni' ? '#2563eb' : 'white',
                          borderColor: selectedRole === 'alumni' ? '#2563eb' : '#e5e7eb',
                          color: selectedRole === 'alumni' ? 'white' : '#374151'
                        }}
                        onClick={() => handleRoleSelect('alumni')}
                      >
                        <i className="fas fa-briefcase" style={{
                          fontSize: '20px',
                          marginBottom: '8px',
                          display: 'block'
                        }}></i>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Alumni</h3>
                      </div>
                    </div>
                  </div>
                  
                  {/* Student Fields */}
                  {selectedRole === 'student' && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="register-school-id">School ID Number</label>
                        <input
                          type="text"
                          id="register-school-id"
                          name="schoolId"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box',
                            backgroundColor: errors.schoolId ? '#fef2f2' : 'white',
                            borderColor: errors.schoolId ? '#ef4444' : '#e5e7eb'
                          }}
                          placeholder="Enter your school ID number"
                          value={formData.schoolId}
                          onChange={handleInputChange}
                          autoComplete="off"
                        />
                        {errors.schoolId && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '12px',
                            marginTop: '4px',
                            fontWeight: '500'
                          }}>{errors.schoolId}</div>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="student-batch">Batch Year</label>
                        <input
                          type="text"
                          id="student-batch"
                          name="batch"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box',
                            backgroundColor: errors.batch ? '#fef2f2' : 'white',
                            borderColor: errors.batch ? '#ef4444' : '#e5e7eb'
                          }}
                          placeholder="e.g., 2023"
                          value={formData.batch}
                          onChange={handleInputChange}
                          autoComplete="off"
                        />
                        {errors.batch && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '12px',
                            marginTop: '4px',
                            fontWeight: '500'
                          }}>{errors.batch}</div>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="student-course">Course/Major</label>
                        <input
                          type="text"
                          id="student-course"
                          name="course"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box',
                            backgroundColor: errors.course ? '#fef2f2' : 'white',
                            borderColor: errors.course ? '#ef4444' : '#e5e7eb'
                          }}
                          placeholder="e.g., Computer Science"
                          value={formData.course}
                          onChange={handleInputChange}
                          autoComplete="off"
                        />
                        {errors.course && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '12px',
                            marginTop: '4px',
                            fontWeight: '500'
                          }}>{errors.course}</div>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="student-goals">Career Goals</label>
                        <textarea
                          id="student-goals"
                          name="goals"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box',
                            backgroundColor: errors.goals ? '#fef2f2' : 'white',
                            borderColor: errors.goals ? '#ef4444' : '#e5e7eb'
                          }}
                          rows="3"
                          placeholder="Describe your career aspirations"
                          value={formData.goals}
                          onChange={handleInputChange}
                          autoComplete="off"
                        />
                        {errors.goals && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '12px',
                            marginTop: '4px',
                            fontWeight: '500'
                          }}>{errors.goals}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Alumni Fields */}
                  {selectedRole === 'alumni' && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="alumni-experience">Work Experience</label>
                        <textarea
                          id="alumni-experience"
                          name="experience"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box',
                            backgroundColor: errors.experience ? '#fef2f2' : 'white',
                            borderColor: errors.experience ? '#ef4444' : '#e5e7eb'
                          }}
                          rows="3"
                          placeholder="Briefly describe your work experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          autoComplete="off"
                        />
                        {errors.experience && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '12px',
                            marginTop: '4px',
                            fontWeight: '500'
                          }}>{errors.experience}</div>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="alumni-skills">Skills</label>
                        <input
                          type="text"
                          id="alumni-skills"
                          name="skills"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '16px',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box',
                            backgroundColor: errors.skills ? '#fef2f2' : 'white',
                            borderColor: errors.skills ? '#ef4444' : '#e5e7eb'
                          }}
                          placeholder="e.g., Project Management, Web Development"
                          value={formData.skills}
                          onChange={handleInputChange}
                          autoComplete="off"
                        />
                        {errors.skills && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '12px',
                            marginTop: '4px',
                            fontWeight: '500'
                          }}>{errors.skills}</div>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="willing-to-mentor" style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          <input
                            type="checkbox"
                            id="willing-to-mentor"
                            name="willingToMentor"
                            checked={formData.willingToMentor}
                            onChange={handleInputChange}
                            autoComplete="off"
                            style={{
                              marginRight: '8px',
                              accentColor: '#2563eb'
                            }}
                          />
                          I am willing to mentor students
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {errors.general && (
                    <div style={{
                      color: '#ef4444',
                      fontSize: '12px',
                      marginTop: '4px',
                      fontWeight: '500'
                    }}>{errors.general}</div>
                  )}
                  
                  <button 
                    type="submit" 
                    style={{
                      width: '100%',
                      padding: '15px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      marginTop: '20px'
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registering...' : 'Register'}
                  </button>
                </form>
              </div>
              
              <div style={{
                textAlign: 'center',
                marginTop: '30px',
                padding: '20px',
                background: 'rgba(37, 99, 235, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(37, 99, 235, 0.1)'
              }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Already have an account? </span>
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
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;