import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './StudentProfiles.css';

function StudentProfiles() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchStudents();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load student profiles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.course?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !courseFilter || student.course === courseFilter;
    const matchesBatch = !batchFilter || student.batch === batchFilter;
    const matchesSkills = !skillsFilter || 
                         (student.skills && student.skills.some(skill => 
                           skill.toLowerCase().includes(skillsFilter.toLowerCase())
                         ));
    
    return matchesSearch && matchesCourse && matchesBatch && matchesSkills;
  });

  const handleViewProfile = (studentId) => {
    navigate(`/profile/${studentId}`);
  };

  const handleBackToDashboard = () => {
    navigate('/alumni-dashboard');
  };

  // Redirect if not authenticated
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="student-profiles">
        <div className="dashboard-container">
          <div className="loading">Loading student profiles...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-profiles">
        <div className="dashboard-container">
          <div className="error">
            <h2>Error Loading Profiles</h2>
            <p>{error}</p>
            <button onClick={fetchStudents} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={handleBackToDashboard} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-profiles">
      <div className="container">
        <div className="page-header">
          <button onClick={handleBackToDashboard} className="back-btn">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
          <h1>Student Profiles</h1>
          <p>Browse and connect with students seeking mentorship</p>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search students by name, course, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <i className="fas fa-search search-icon"></i>
          </div>

          <div className="filters">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Courses</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Medicine">Medicine</option>
              <option value="Law">Law</option>
            </select>

            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Batches</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>

            <select
              value={skillsFilter}
              onChange={(e) => setSkillsFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Skills</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="leadership">Leadership</option>
              <option value="communication">Communication</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <span>{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found</span>
        </div>

        {/* Students Grid */}
        {filteredStudents.length > 0 ? (
          <div className="students-grid">
            {filteredStudents.map(student => (
              <div key={student.id} className="student-card">
                <div className="student-avatar">
                  {student.firstName && student.lastName 
                    ? `${student.firstName[0]}${student.lastName[0]}`
                    : 'S'
                  }
                </div>
                
                <div className="student-info">
                  <h3 className="student-name">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="student-course">{student.course || 'Course not specified'}</p>
                  <p className="student-batch">Batch {student.batch || 'N/A'}</p>
                  
                  {student.goals && (
                    <div className="student-goals">
                      <strong>Goals:</strong> {student.goals}
                    </div>
                  )}
                  
                  {student.skills && student.skills.length > 0 && (
                    <div className="student-skills">
                      <strong>Skills:</strong>
                      <div className="skills-tags">
                        {student.skills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                        {student.skills.length > 3 && (
                          <span className="skill-tag">+{student.skills.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="student-actions">
                  <button 
                    onClick={() => handleViewProfile(student.id)}
                    className="btn btn-primary"
                  >
                    View Profile
                  </button>
                  <button 
                    onClick={() => navigate('/messaging', { 
                      state: { 
                        startChatWith: {
                          id: student.id,
                          name: `${student.firstName} ${student.lastName}`,
                          role: student.role
                        }
                      }
                    })}
                    className="btn btn-outline"
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No students found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentProfiles;
