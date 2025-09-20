import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import './ProfileVerification.css';

const ProfileVerification = ({ onClose, onVerificationSubmit }) => {
  const { currentUser } = useAuth();
  const [verificationData, setVerificationData] = useState({
    fullName: '',
    studentId: '',
    batch: '',
    course: '',
    yearGraduated: '',
    currentWork: '',
    workPosition: '',
    workCompany: '',
    skills: [],
    verificationType: 'student', // 'student' or 'alumni'
    schoolIdImage: null,
    transcriptImage: null,
    diplomaImage: null,
    workIdImage: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentUser) {
      // Pre-fill with existing user data
      setVerificationData(prev => ({
        ...prev,
        fullName: currentUser.displayName || '',
        verificationType: currentUser.role || 'student'
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setVerificationData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else if (name === 'skills') {
      const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill);
      setVerificationData(prev => ({
        ...prev,
        [name]: skillsArray
      }));
    } else {
      setVerificationData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    
    try {
      const storageRef = ref(storage, path);
      setUploadProgress(prev => ({ ...prev, [path]: 0 }));
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadProgress(prev => ({ ...prev, [path]: 100 }));
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!verificationData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!verificationData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }
    
    if (!verificationData.batch.trim()) {
      newErrors.batch = 'Batch is required';
    }
    
    if (!verificationData.course.trim()) {
      newErrors.course = 'Course is required';
    }
    
    if (verificationData.verificationType === 'alumni') {
      if (!verificationData.yearGraduated) {
        newErrors.yearGraduated = 'Year graduated is required for alumni';
      }
      if (!verificationData.currentWork.trim()) {
        newErrors.currentWork = 'Current work is required for alumni';
      }
    }
    
    if (!verificationData.schoolIdImage) {
      newErrors.schoolIdImage = 'School ID image is required';
    }
    
    if (verificationData.verificationType === 'alumni' && !verificationData.diplomaImage) {
      newErrors.diplomaImage = 'Diploma image is required for alumni';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload files
      const uploadPromises = [];
      const fileUrls = {};
      
      if (verificationData.schoolIdImage) {
        const path = `verification/${currentUser.uid}/school_id_${Date.now()}`;
        uploadPromises.push(
          uploadFile(verificationData.schoolIdImage, path).then(url => {
            fileUrls.schoolIdUrl = url;
          })
        );
      }
      
      if (verificationData.transcriptImage) {
        const path = `verification/${currentUser.uid}/transcript_${Date.now()}`;
        uploadPromises.push(
          uploadFile(verificationData.transcriptImage, path).then(url => {
            fileUrls.transcriptUrl = url;
          })
        );
      }
      
      if (verificationData.diplomaImage) {
        const path = `verification/${currentUser.uid}/diploma_${Date.now()}`;
        uploadPromises.push(
          uploadFile(verificationData.diplomaImage, path).then(url => {
            fileUrls.diplomaUrl = url;
          })
        );
      }
      
      if (verificationData.workIdImage) {
        const path = `verification/${currentUser.uid}/work_id_${Date.now()}`;
        uploadPromises.push(
          uploadFile(verificationData.workIdImage, path).then(url => {
            fileUrls.workIdUrl = url;
          })
        );
      }
      
      await Promise.all(uploadPromises);
      
      // Create verification request
      const verificationRequest = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        fullName: verificationData.fullName,
        studentId: verificationData.studentId,
        batch: verificationData.batch,
        course: verificationData.course,
        yearGraduated: verificationData.yearGraduated,
        currentWork: verificationData.currentWork,
        workPosition: verificationData.workPosition,
        workCompany: verificationData.workCompany,
        skills: verificationData.skills,
        verificationType: verificationData.verificationType,
        schoolIdUrl: fileUrls.schoolIdUrl,
        transcriptUrl: fileUrls.transcriptUrl,
        diplomaUrl: fileUrls.diplomaUrl,
        workIdUrl: fileUrls.workIdUrl,
        status: 'pending',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null
      };
      
      // Save verification request
      await addDoc(collection(db, 'verification-requests'), verificationRequest);
      
      // Update user profile with verification data
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fullName: verificationData.fullName,
        studentId: verificationData.studentId,
        batch: verificationData.batch,
        course: verificationData.course,
        yearGraduated: verificationData.yearGraduated,
        currentWork: verificationData.currentWork,
        workPosition: verificationData.workPosition,
        workCompany: verificationData.workCompany,
        skills: verificationData.skills,
        verificationStatus: 'pending',
        lastUpdated: serverTimestamp()
      });
      
      alert('Verification request submitted successfully! You will be notified once it is reviewed.');
      
      if (onVerificationSubmit) {
        onVerificationSubmit();
      }
      
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Failed to submit verification request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="verification-modal-overlay">
      <div className="verification-modal">
        <div className="verification-header">
          <h2>Profile Verification</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="verification-form">
          <div className="verification-section">
            <h3>Personal Information</h3>
            
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={verificationData.fullName}
                onChange={handleInputChange}
                className={errors.fullName ? 'error' : ''}
                placeholder="Enter your full name"
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>
            
            <div className="form-group">
              <label>Student ID *</label>
              <input
                type="text"
                name="studentId"
                value={verificationData.studentId}
                onChange={handleInputChange}
                className={errors.studentId ? 'error' : ''}
                placeholder="Enter your student ID"
              />
              {errors.studentId && <span className="error-text">{errors.studentId}</span>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Batch *</label>
                <input
                  type="text"
                  name="batch"
                  value={verificationData.batch}
                  onChange={handleInputChange}
                  className={errors.batch ? 'error' : ''}
                  placeholder="e.g., 2020"
                />
                {errors.batch && <span className="error-text">{errors.batch}</span>}
              </div>
              
              <div className="form-group">
                <label>Course *</label>
                <input
                  type="text"
                  name="course"
                  value={verificationData.course}
                  onChange={handleInputChange}
                  className={errors.course ? 'error' : ''}
                  placeholder="e.g., Computer Science"
                />
                {errors.course && <span className="error-text">{errors.course}</span>}
              </div>
            </div>
          </div>
          
          <div className="verification-section">
            <h3>Verification Type</h3>
            <div className="verification-type-selector">
              <label className="radio-option">
                <input
                  type="radio"
                  name="verificationType"
                  value="student"
                  checked={verificationData.verificationType === 'student'}
                  onChange={handleInputChange}
                />
                <span>Student</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="verificationType"
                  value="alumni"
                  checked={verificationData.verificationType === 'alumni'}
                  onChange={handleInputChange}
                />
                <span>Alumni</span>
              </label>
            </div>
          </div>
          
          {verificationData.verificationType === 'alumni' && (
            <div className="verification-section">
              <h3>Alumni Information</h3>
              
              <div className="form-group">
                <label>Year Graduated *</label>
                <input
                  type="number"
                  name="yearGraduated"
                  value={verificationData.yearGraduated}
                  onChange={handleInputChange}
                  className={errors.yearGraduated ? 'error' : ''}
                  placeholder="e.g., 2020"
                  min="2000"
                  max="2030"
                />
                {errors.yearGraduated && <span className="error-text">{errors.yearGraduated}</span>}
              </div>
              
              <div className="form-group">
                <label>Current Work/Position *</label>
                <input
                  type="text"
                  name="currentWork"
                  value={verificationData.currentWork}
                  onChange={handleInputChange}
                  className={errors.currentWork ? 'error' : ''}
                  placeholder="e.g., Software Engineer"
                />
                {errors.currentWork && <span className="error-text">{errors.currentWork}</span>}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    name="workCompany"
                    value={verificationData.workCompany}
                    onChange={handleInputChange}
                    placeholder="e.g., Google"
                  />
                </div>
                
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    name="workPosition"
                    value={verificationData.workPosition}
                    onChange={handleInputChange}
                    placeholder="e.g., Senior Developer"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="verification-section">
            <h3>Skills</h3>
            <div className="form-group">
              <label>Skills (comma-separated)</label>
              <input
                type="text"
                name="skills"
                value={verificationData.skills.join(', ')}
                onChange={handleInputChange}
                placeholder="e.g., JavaScript, React, Python, Leadership"
              />
            </div>
          </div>
          
          <div className="verification-section">
            <h3>Verification Documents</h3>
            
            <div className="form-group">
              <label>School ID Image *</label>
              <input
                type="file"
                name="schoolIdImage"
                accept="image/*"
                onChange={handleInputChange}
                className={errors.schoolIdImage ? 'error' : ''}
              />
              {errors.schoolIdImage && <span className="error-text">{errors.schoolIdImage}</span>}
              <small>Upload a clear photo of your school ID</small>
            </div>
            
            <div className="form-group">
              <label>Transcript Image</label>
              <input
                type="file"
                name="transcriptImage"
                accept="image/*"
                onChange={handleInputChange}
              />
              <small>Upload your academic transcript (optional but recommended)</small>
            </div>
            
            {verificationData.verificationType === 'alumni' && (
              <div className="form-group">
                <label>Diploma Image *</label>
                <input
                  type="file"
                  name="diplomaImage"
                  accept="image/*"
                  onChange={handleInputChange}
                  className={errors.diplomaImage ? 'error' : ''}
                />
                {errors.diplomaImage && <span className="error-text">{errors.diplomaImage}</span>}
                <small>Upload your diploma or certificate</small>
              </div>
            )}
            
            {verificationData.verificationType === 'alumni' && (
              <div className="form-group">
                <label>Work ID Image</label>
                <input
                  type="file"
                  name="workIdImage"
                  accept="image/*"
                  onChange={handleInputChange}
                />
                <small>Upload your work ID or employment certificate (optional)</small>
              </div>
            )}
          </div>
          
          <div className="verification-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileVerification;
