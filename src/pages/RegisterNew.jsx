import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import logoImage from '../components/Logo2.png';
import '../styles/responsive.css';

function Register() {
  const navigate = useNavigate();
  const { signup, currentUser, userRole } = useAuth();
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
      // Navigate to login page
      navigate('/login?from=registration');
      }, 2000);
    } catch (error) {
      console.error('Registration failed:', error);
      // Handle registration error
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {/* Responsive Header */}
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="header-content">
            {/* Logo Section */}
            <div className="logo">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-300"
              >
                <i className="fas fa-arrow-left text-sm"></i>
                <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
              </button>
              <img 
                src={logoImage} 
                alt="Connectrix Logo" 
                className="logo-image"
              />
              <span className="logo-text">CONNECTRIX</span>
            </div>
            
            {/* Navigation Section */}
            <nav className="nav">
              <button 
                onClick={() => navigate('/login')} 
                className="btn btn-primary"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="btn btn-primary"
              >
                Register
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <div className="card">
            {/* Card Header */}
            <div className="card-header">
              <img 
                src={logoImage} 
                alt="Connectrix Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl object-cover shadow-lg"
              />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-600 mb-2 tracking-wide">
                CONNECTRIX
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 font-medium">
                Connecting Students & Alumni for Growth and Mentorship
              </p>
              <div className="mt-4 px-4 py-2 bg-blue-50 rounded-full inline-block">
                <span className="text-xs sm:text-sm font-semibold text-blue-600 tracking-wider uppercase">
                  Registration Form
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="card-body">
              {showSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-green-700 font-medium">
                    Registration successful! Please check your email to verify your account.
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className={`form-input ${errors.firstName ? 'error' : ''}`}
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      autoComplete="given-name"
                    />
                    {errors.firstName && (
                      <div className="form-error">{errors.firstName}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className={`form-input ${errors.lastName ? 'error' : ''}`}
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      autoComplete="family-name"
                    />
                    {errors.lastName && (
                      <div className="form-error">{errors.lastName}</div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <div className="form-error">{errors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className={`form-input ${errors.username ? 'error' : ''}`}
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                    autoComplete="username"
                  />
                  {errors.username && (
                    <div className="form-error">{errors.username}</div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        className={`form-input pr-10 ${errors.password ? 'error' : ''}`}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    {errors.password && (
                      <div className="form-error">{errors.password}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        className={`form-input pr-10 ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="form-error">{errors.confirmPassword}</div>
                    )}
                  </div>
                </div>

                {/* Role Selection */}
                <div className="form-group">
                  <label className="form-label">I am a:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('student')}
                      className={`p-4 border-2 rounded-lg text-center transition-all duration-300 ${
                        selectedRole === 'student'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <i className="fas fa-user-graduate text-xl mb-2 block"></i>
                      <h3 className="font-semibold">Student</h3>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('alumni')}
                      className={`p-4 border-2 rounded-lg text-center transition-all duration-300 ${
                        selectedRole === 'alumni'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <i className="fas fa-briefcase text-xl mb-2 block"></i>
                      <h3 className="font-semibold">Alumni</h3>
                    </button>
                  </div>
                  {errors.role && (
                    <div className="form-error">{errors.role}</div>
                  )}
                </div>

                {/* Student Fields */}
                {selectedRole === 'student' && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <label htmlFor="schoolId" className="form-label">
                        School ID Number
                      </label>
                      <input
                        type="text"
                        id="schoolId"
                        name="schoolId"
                        className={`form-input ${errors.schoolId ? 'error' : ''}`}
                        placeholder="Enter your school ID number"
                        value={formData.schoolId}
                        onChange={handleInputChange}
                      />
                      {errors.schoolId && (
                        <div className="form-error">{errors.schoolId}</div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label htmlFor="batch" className="form-label">
                          Batch Year
                        </label>
                        <input
                          type="text"
                          id="batch"
                          name="batch"
                          className={`form-input ${errors.batch ? 'error' : ''}`}
                          placeholder="e.g., 2023"
                          value={formData.batch}
                          onChange={handleInputChange}
                        />
                        {errors.batch && (
                          <div className="form-error">{errors.batch}</div>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="course" className="form-label">
                          Course/Major
                        </label>
                        <input
                          type="text"
                          id="course"
                          name="course"
                          className={`form-input ${errors.course ? 'error' : ''}`}
                          placeholder="e.g., Computer Science"
                          value={formData.course}
                          onChange={handleInputChange}
                        />
                        {errors.course && (
                          <div className="form-error">{errors.course}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="goals" className="form-label">
                        Career Goals
                      </label>
                      <textarea
                        id="goals"
                        name="goals"
                        rows="3"
                        className={`form-input ${errors.goals ? 'error' : ''}`}
                        placeholder="Describe your career aspirations"
                        value={formData.goals}
                        onChange={handleInputChange}
                      />
                      {errors.goals && (
                        <div className="form-error">{errors.goals}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Alumni Fields */}
                {selectedRole === 'alumni' && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <label htmlFor="experience" className="form-label">
                        Work Experience
                      </label>
                      <textarea
                        id="experience"
                        name="experience"
                        rows="3"
                        className={`form-input ${errors.experience ? 'error' : ''}`}
                        placeholder="Briefly describe your work experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                      />
                      {errors.experience && (
                        <div className="form-error">{errors.experience}</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="skills" className="form-label">
                        Skills
                      </label>
                      <input
                        type="text"
                        id="skills"
                        name="skills"
                        className={`form-input ${errors.skills ? 'error' : ''}`}
                        placeholder="e.g., Project Management, Web Development"
                        value={formData.skills}
                        onChange={handleInputChange}
                      />
                      {errors.skills && (
                        <div className="form-error">{errors.skills}</div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="willingToMentor"
                          checked={formData.willingToMentor}
                          onChange={handleInputChange}
                          className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          I am willing to mentor students
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {errors.general && (
                  <div className="form-error">{errors.general}</div>
                )}

                <button 
                  type="submit" 
                  className="w-full btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register'}
                </button>
              </form>
            </div>

            {/* Card Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <button 
                type="button" 
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;

