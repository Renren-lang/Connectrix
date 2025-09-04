import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  
  const [activeTab, setActiveTab] = useState('about');
  const [isConnected, setIsConnected] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [posts, setPosts] = useState([
    {
      id: 1,
      date: 'October 15, 2023',
      type: 'advice',
      content: 'For students interested in machine learning: Focus on building a strong foundation in mathematics and statistics first. Then, learn Python and libraries like TensorFlow or PyTorch. Most importantly, work on real projects - that\'s where you\'ll truly learn and build a portfolio that stands out.',
      likes: 42,
      comments: 8,
      isLiked: false
    },
    {
      id: 2,
      date: 'September 28, 2023',
      type: 'update',
      content: 'Excited to share that I\'ll be speaking at the upcoming Tech Leaders Conference next month! I\'ll be discussing the future of AI infrastructure and how it\'s shaping the tech industry. Looking forward to connecting with fellow alumni and students there.',
      likes: 35,
      comments: 12,
      isLiked: false
    },
    {
      id: 3,
      date: 'August 10, 2023',
      type: 'memory',
      content: 'Throwback to my college days! Found this photo from the 2015 hackathon where my team built our first AI project. It\'s amazing to see how far we\'ve come. To all current students: cherish these moments, they\'re the foundation of your future career!',
      likes: 58,
      comments: 15,
      isLiked: false
    }
  ]);

  const [gallery] = useState([
    {
      id: 1,
      image: 'https://picsum.photos/seed/tech-conference/400/400.jpg',
      title: 'Tech Leaders Conference',
      date: 'October 2023'
    },
    {
      id: 2,
      image: 'https://picsum.photos/seed/office-team/400/400.jpg',
      title: 'Google Team Outing',
      date: 'September 2023'
    },
    {
      id: 3,
      image: 'https://picsum.photos/seed/university-campus/400/400.jpg',
      title: 'Alumni Visit',
      date: 'June 2023'
    },
    {
      id: 4,
      image: 'https://picsum.photos/seed/mentoring-session/400/400.jpg',
      title: 'Mentoring Session',
      date: 'May 2023'
    },
    {
      id: 5,
      image: 'https://picsum.photos/seed/graduation-ceremony/400/400.jpg',
      title: 'Graduation Day',
      date: '2015'
    },
    {
      id: 6,
      image: 'https://picsum.photos/seed/hackathon-team/400/400.jpg',
      title: 'Hackathon Winners',
      date: '2014'
    }
  ]);

  // Fetch user data when component mounts or userId changes
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // If no userId in URL, show current user's profile
        const targetUserId = userId || currentUser?.uid;
        
        if (!targetUserId) {
          navigate('/login');
          return;
        }
        
        // Check if viewing own profile
        setIsOwnProfile(targetUserId === currentUser?.uid);
        
        // Fetch user data from Firestore
        const userRef = doc(db, 'users', targetUserId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          // User not found, redirect to appropriate dashboard based on user role
          if (userRole === 'student') {
            navigate('/student-dashboard');
          } else {
            navigate('/alumni-dashboard');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Redirect to appropriate dashboard based on user role
        if (userRole === 'student') {
          navigate('/student-dashboard');
        } else {
          navigate('/alumni-dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchUserData();
    }
  }, [userId, currentUser, navigate]);

  // Loading and error states
  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-page">
        <div className="error">
          <h2>Profile not found</h2>
          <p>The requested profile could not be loaded. This might be because:</p>
          <ul>
            <li>The user doesn't exist in our database</li>
            <li>There was a connection error</li>
            <li>The profile is private or restricted</li>
          </ul>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleConnect = () => {
    if (!isConnected) {
      setIsConnected(true);
      alert('Connection request sent!');
    } else {
      // Navigate to messaging with user info
      navigate('/messaging', {
        state: {
          startChatWith: {
            id: userId,
            name: `${userData.firstName} ${userData.lastName}`,
            role: userData.role
          }
        }
      });
    }
  };

  const handlePostAction = (postId, actionType) => {
    if (actionType === 'like') {
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          };
        }
        return post;
      }));
    } else {
      alert(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} functionality would be implemented here`);
    }
  };

  const handleGalleryClick = (title) => {
    alert(`Opening full view of: ${title}`);
  };

  const handleNotificationClick = () => {
    alert('Notifications panel would open here');
  };

  const handleUserProfileClick = () => {
    alert('User profile menu would open here');
  };

  const getPostTypeClass = (type) => {
    switch (type) {
      case 'update':
        return 'type-update';
      case 'advice':
        return 'type-advice';
      case 'memory':
        return 'type-memory';
      default:
        return '';
    }
  };

  return (
    <>


      {/* Profile Header */}
      <div className="profile-header">
        <div className="dashboard-container">
          <div className="profile-picture">
            {userData.profilePictureUrl ? (
              <img src={userData.profilePictureUrl} alt="Profile" />
            ) : (
              userData.firstName && userData.lastName 
                ? `${userData.firstName[0]}${userData.lastName[0]}`
                : 'U'
            )}
          </div>
          <h1 className="profile-name">{userData.firstName} {userData.lastName}</h1>
          <div className="profile-meta">
            <div className="profile-meta-item">
              <i className="fas fa-calendar-alt"></i>
              <span>Batch of {userData.batch || 'N/A'}</span>
            </div>
            <div className="profile-meta-item">
              <i className="fas fa-graduation-cap"></i>
              <span>{userData.course || 'Course not specified'}</span>
            </div>
            <div className="profile-meta-item">
              <i className="fas fa-briefcase"></i>
              <span>{userData.role === 'alumni' ? 'Alumni' : 'Student'}</span>
            </div>
          </div>
          <div className="profile-actions">
            {!isOwnProfile ? (
              <>
                <button className="btn btn-primary" onClick={handleConnect}>
                  {isConnected ? 'Connected' : 'Connect'}
                </button>
                {isConnected && (
                  <button 
                    className="btn btn-outline"
                    onClick={() => navigate('/messaging', {
                      state: {
                        startChatWith: {
                          id: userId,
                          name: `${userData.firstName} ${userData.lastName}`,
                          role: userData.role
                        }
                      }
                    })}
                  >
                    Message
                  </button>
                )}
                <button className="btn btn-outline">Share Profile</button>
              </>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/notification-settings')}
              >
                Edit Profile
              </button>
            )}
          </div>
          
          
        </div>
      </div>

      {/* Profile Content */}
      <div className="container">
        <div className="profile-content">
          {/* Tabs */}
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => handleTabChange('about')}
            >
              About
            </div>
            <div 
              className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => handleTabChange('skills')}
            >
              Skills / Interests
            </div>
            <div 
              className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => handleTabChange('posts')}
            >
              Posts
            </div>
            <div 
              className={`tab ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => handleTabChange('gallery')}
            >
              Gallery
            </div>
          </div>

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="tab-content active" id="about-tab">
              <div className="section">
                <h2 className="section-title">
                  <i className="fas fa-user"></i>
                  Bio
                </h2>
                <p className="bio">
                  {userData.bio || 'No bio available yet.'}
                </p>
              </div>

              <div className="section">
                <h2 className="section-title">
                  <i className="fas fa-graduation-cap"></i>
                  Education
                </h2>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-date">2011 - 2015</div>
                    <div className="timeline-title">Bachelor of Science in Computer Science</div>
                    <div className="timeline-subtitle">University of Technology</div>
                    <div className="timeline-description">Graduated with honors, specializing in Artificial Intelligence and Machine Learning</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-date">2015 - 2017</div>
                    <div className="timeline-title">Master of Science in Computer Science</div>
                    <div className="timeline-subtitle">Stanford University</div>
                    <div className="timeline-description">Focused on distributed systems and cloud computing</div>
                  </div>
                </div>
              </div>

              <div className="section">
                <h2 className="section-title">
                  <i className="fas fa-briefcase"></i>
                  Work Experience
                </h2>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-date">2019 - Present</div>
                    <div className="timeline-title">Senior Software Engineer</div>
                    <div className="timeline-subtitle">Google</div>
                    <div className="timeline-description">Leading the development of machine learning infrastructure for Google Cloud Platform</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-date">2017 - 2019</div>
                    <div className="timeline-title">Software Engineer</div>
                    <div className="timeline-subtitle">Microsoft</div>
                    <div className="timeline-description">Worked on Azure AI services, focusing on natural language processing</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-date">2015 - 2017</div>
                    <div className="timeline-title">Junior Software Developer</div>
                    <div className="timeline-subtitle">TechStart Inc.</div>
                    <div className="timeline-description">Developed web applications and contributed to open-source projects</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills/Interests Tab */}
          {activeTab === 'skills' && (
            <div className="tab-content active" id="skills-tab">
              <div className="section">
                <h2 className="section-title">
                  <i className="fas fa-cogs"></i>
                  Skills
                </h2>
                <div className="skills-container">
                  <div className="skill-tag">Python</div>
                  <div className="skill-tag">Java</div>
                  <div className="skill-tag">Machine Learning</div>
                  <div className="skill-tag">Cloud Computing</div>
                  <div className="skill-tag">Distributed Systems</div>
                  <div className="skill-tag">TensorFlow</div>
                  <div className="skill-tag">Kubernetes</div>
                  <div className="skill-tag">Data Structures</div>
                  <div className="skill-tag">Algorithms</div>
                  <div className="skill-tag">Team Leadership</div>
                </div>
              </div>

              <div className="section">
                <h2 className="section-title">
                  <i className="fas fa-heart"></i>
                  Interests
                </h2>
                <div className="interests-container">
                  <div className="interest-card">
                    <div className="interest-icon">
                      <i className="fas fa-robot"></i>
                    </div>
                    <div className="interest-name">Artificial Intelligence</div>
                  </div>
                  <div className="interest-card">
                    <div className="interest-icon">
                      <i className="fas fa-cloud"></i>
                    </div>
                    <div className="interest-name">Cloud Technologies</div>
                  </div>
                  <div className="interest-card">
                    <div className="interest-icon">
                      <i className="fas fa-code"></i>
                    </div>
                    <div className="interest-name">Open Source</div>
                  </div>
                  <div className="interest-card">
                    <div className="interest-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="interest-name">Mentorship</div>
                  </div>
                  <div className="interest-card">
                    <div className="interest-icon">
                      <i className="fas fa-hiking"></i>
                    </div>
                    <div className="interest-name">Outdoor Activities</div>
                  </div>
                  <div className="interest-card">
                    <div className="interest-icon">
                      <i className="fas fa-book"></i>
                    </div>
                    <div className="interest-name">Reading</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="tab-content active" id="posts-tab">
              <div className="posts-container">
                {posts.map(post => (
                  <div key={post.id} className="post">
                    <div className="post-header">
                      <div className="post-date">{post.date}</div>
                      <div className={`post-type ${getPostTypeClass(post.type)}`}>
                        {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                      </div>
                    </div>
                    <div className="post-content">
                      {post.content}
                    </div>
                    <div className="post-actions">
                      <div 
                        className="post-action"
                        onClick={() => handlePostAction(post.id, 'like')}
                        style={{ color: post.isLiked ? 'var(--danger-color)' : '' }}
                      >
                        <i className={post.isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
                        <span>{post.likes}</span>
                      </div>
                      <div 
                        className="post-action"
                        onClick={() => handlePostAction(post.id, 'comment')}
                      >
                        <i className="far fa-comment"></i>
                        <span>{post.comments}</span>
                      </div>
                      <div 
                        className="post-action"
                        onClick={() => handlePostAction(post.id, 'share')}
                      >
                        <i className="far fa-share"></i>
                        <span>Share</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="tab-content active" id="gallery-tab">
              <div className="gallery-container">
                {gallery.map(item => (
                  <div 
                    key={item.id} 
                    className="gallery-item"
                    onClick={() => handleGalleryClick(item.title)}
                  >
                    <img src={item.image} alt={item.title} />
                    <div className="gallery-overlay">
                      <div className="gallery-title">{item.title}</div>
                      <div className="gallery-date">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;
