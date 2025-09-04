import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

function Register() {
  const navigate = useNavigate();
  const { signup, currentUser, userRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
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
        batch: '',
        course: '',
        goals: ''
      }));
    } else {
      setErrors(prev => ({
        ...prev,
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
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!selectedRole) newErrors.role = 'Please select your role (Student or Alumni)';
    
    if (selectedRole === 'student') {
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
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
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
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration failed:', error);
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
    <div style={{
      backgroundImage: 'url(/assets/image.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      padding: '2rem 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
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
          {showSuccess && (
          <div className="success-message show">
            Registration successful! Please check your email to verify your account.
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input
              type="email"
              id="register-email"
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
            <label htmlFor="register-first-name">First Name</label>
            <input
              type="text"
              id="register-first-name"
              name="firstName"
              className={`form-control ${errors.firstName ? 'error' : ''}`}
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleInputChange}
              autoComplete="given-name"
            />
            {errors.firstName && (
              <div className="error-message show">{errors.firstName}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="register-last-name">Last Name</label>
            <input
              type="text"
              id="register-last-name"
              name="lastName"
              className={`form-control ${errors.lastName ? 'error' : ''}`}
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleInputChange}
              autoComplete="family-name"
            />
            {errors.lastName && (
              <div className="error-message show">{errors.lastName}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="register-password">Password</label>
              <div style={{ position: 'relative' }}>
            <input
                  type={showPassword ? "text" : "password"}
              id="register-password"
              name="password"
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder="Create a password"
              value={formData.password}
              onChange={handleInputChange}
                  style={{ paddingRight: '45px' }}
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
              <div className="error-message show">{errors.password}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="register-confirm-password">Confirm Password</label>
              <div style={{ position: 'relative' }}>
            <input
                  type={showConfirmPassword ? "text" : "password"}
              id="register-confirm-password"
              name="confirmPassword"
              className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
                  style={{ paddingRight: '45px' }}
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
              <div className="error-message show">{errors.confirmPassword}</div>
            )}
          </div>
          
          <div className="form-group">
            <label>I am a:</label>
              <div className="form-role-selection">
              <div
                  className={`form-role-option ${selectedRole === 'student' ? 'selected' : ''}`}
                onClick={() => handleRoleSelect('student')}
              >
                <i className="fas fa-user-graduate"></i>
                <h3>Student</h3>
              </div>
              <div
                  className={`form-role-option ${selectedRole === 'alumni' ? 'selected' : ''}`}
                onClick={() => handleRoleSelect('alumni')}
              >
                <i className="fas fa-briefcase"></i>
                <h3>Alumni</h3>
              </div>
            </div>
          </div>
          
          {/* Student Fields */}
          {selectedRole === 'student' && (
            <div className="conditional-fields active">
              <div className="form-group">
                <label htmlFor="student-batch">Batch Year</label>
                <input
                  type="text"
                  id="student-batch"
                  name="batch"
                  className={`form-control ${errors.batch ? 'error' : ''}`}
                  placeholder="e.g., 2023"
                  value={formData.batch}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
                {errors.batch && (
                  <div className="error-message show">{errors.batch}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="student-course">Course/Major</label>
                <input
                  type="text"
                  id="student-course"
                  name="course"
                  className={`form-control ${errors.course ? 'error' : ''}`}
                  placeholder="e.g., Computer Science"
                  value={formData.course}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
                {errors.course && (
                  <div className="error-message show">{errors.course}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="student-goals">Career Goals</label>
                <textarea
                  id="student-goals"
                  name="goals"
                  className={`form-control ${errors.goals ? 'error' : ''}`}
                  rows="3"
                  placeholder="Describe your career aspirations"
                  value={formData.goals}
                  onChange={handleInputChange}
                  autoComplete="off"
                ></textarea>
                {errors.goals && (
                  <div className="error-message show">{errors.goals}</div>
                )}
              </div>
            </div>
          )}
          
          {/* Alumni Fields */}
          {selectedRole === 'alumni' && (
            <div className="conditional-fields active">
              <div className="form-group">
                <label htmlFor="alumni-experience">Work Experience</label>
                <textarea
                  id="alumni-experience"
                  name="experience"
                  className={`form-control ${errors.experience ? 'error' : ''}`}
                  rows="3"
                  placeholder="Briefly describe your work experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  autoComplete="off"
                ></textarea>
                {errors.experience && (
                  <div className="error-message show">{errors.experience}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="alumni-skills">Skills</label>
                <input
                  type="text"
                  id="alumni-skills"
                  name="skills"
                  className={`form-control ${errors.skills ? 'error' : ''}`}
                  placeholder="e.g., Project Management, Web Development"
                  value={formData.skills}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
                {errors.skills && (
                  <div className="error-message show">{errors.skills}</div>
                )}
              </div>
              
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="willing-to-mentor"
                  name="willingToMentor"
                  checked={formData.willingToMentor}
                  onChange={handleInputChange}
                    autoComplete="off"
                />
                <label htmlFor="willing-to-mentor">I am willing to mentor students</label>
              </div>
            </div>
          )}
          
          {errors.general && (
            <div className="error-message show">{errors.general}</div>
          )}
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        
        <div className="form-footer">
          Already have an account?           <button 
            type="button" 
            className="link-button"
              onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
        </div> {/* auth-body */}
        </div>   {/* auth-container */}
      </div>
    </div>
  );
}

export default Register;
