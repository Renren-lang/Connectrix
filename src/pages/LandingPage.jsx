import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login');
  };



  return (
    <>
      {/* New Navbar - Matching Image Design */}
      <nav className="landing-navbar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '65px',
        padding: '0 2rem',
        background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)',
        borderBottom: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'none',
        borderRadius: '0'
      }}>
        {/* Left Side - CONNECTRIX Text */}
        <div className="navbar-brand" style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'white',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.7)',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            CONNECTRIX
          </span>
        </div>

        {/* Right Side - Login and Register Buttons */}
        <div className="navbar-actions" style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: '#2c3e50',
              border: '1px solid white',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              fontSize: '15px',
              letterSpacing: '0.5px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#34495e';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#2c3e50';
            }}
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')}
            style={{
              background: '#2c3e50',
              border: '1px solid white',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              fontSize: '15px',
              letterSpacing: '0.5px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#34495e';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#2c3e50';
            }}
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" style={{
        backgroundImage: 'url(/assets/image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div className="hero-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1
        }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h1>Revolutionizing Student Engagement</h1>
          <p className="tagline">
            Join Connectrix to experience the power of alumni mentorship at Consolatrix College of City, Inc.
          </p>
          <div className="cta-buttons">
            <button onClick={handleLoginClick} className="btn btn-primary btn-large">
              Get Started
            </button>
          </div>
        </div>
      </section>



      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">App Features</h2>
          <div className="features-container">
            {/* Profiles Feature */}
            <div className="feature-card">
              <div className="feature-image">
                <div className="feature-mockup">
                  <div className="profile-header"></div>
                  <div className="profile-body">
                    <div className="profile-info">
                      <div className="profile-avatar"></div>
                      <div className="profile-details">
                        <h4>Alex Johnson</h4>
                        <p>Computer Science '15</p>
                      </div>
                    </div>
                    <div className="profile-stats">
                      <div className="stat">
                        <div className="stat-value">24</div>
                        <div className="stat-label">Mentees</div>
                      </div>
                      <div className="stat">
                        <div className="stat-value">8</div>
                        <div className="stat-label">Events</div>
                      </div>
                      <div className="stat">
                        <div className="stat-value">4.8</div>
                        <div className="stat-label">Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Professional Profiles</h3>
                <p className="feature-description">Create detailed profiles showcasing your academic background, professional experience, and areas of expertise to connect with the right mentors or mentees.</p>
              </div>
            </div>

            {/* Mentorship Feature */}
            <div className="feature-card">
              <div className="feature-image">
                <div className="feature-mockup">
                  <div className="mentorship-header"></div>
                  <div className="mentorship-body">
                    <div className="mentorship-list">
                      <div className="mentorship-item">
                        <div className="mentorship-avatar"></div>
                        <div className="mentorship-info">
                          <h4>Sarah Williams</h4>
                          <p>Marketing Director</p>
                        </div>
                        <div className="mentorship-status">Active</div>
                      </div>
                      <div className="mentorship-item">
                        <div className="mentorship-avatar"></div>
                        <div className="mentorship-info">
                          <h4>Michael Chen</h4>
                          <p>Software Engineer</p>
                        </div>
                        <div className="mentorship-status">Pending</div>
                      </div>
                      <div className="mentorship-item">
                        <div className="mentorship-avatar"></div>
                        <div className="mentorship-info">
                          <h4>Emma Rodriguez</h4>
                          <p>Finance Manager</p>
                        </div>
                        <div className="mentorship-status">Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Mentorship Connections</h3>
                <p className="feature-description">Find and connect with alumni mentors who can provide guidance, career advice, and industry insights tailored to your academic and professional goals.</p>
              </div>
            </div>

            {/* Events Feature */}
            <div className="feature-card">
              <div className="feature-image">
                <div className="feature-mockup">
                  <div className="events-header"></div>
                  <div className="events-body">
                    <div className="event-card">
                      <div className="event-date">
                        <i className="far fa-calendar"></i>
                        <span>Oct 15, 2023</span>
                      </div>
                      <div className="event-title">Alumni Networking Night</div>
                      <div className="event-location">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>University Campus</span>
                      </div>
                    </div>
                    <div className="event-card">
                      <div className="event-date">
                        <i className="far fa-calendar"></i>
                        <span>Oct 22, 2023</span>
                      </div>
                      <div className="event-title">Career Workshop: Tech Industry</div>
                      <div className="event-location">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>Virtual Event</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Events & Workshops</h3>
                <p className="feature-description">Discover and attend networking events, career workshops, and seminars hosted by alumni and industry professionals to expand your knowledge and connections.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="logo-container">
              <div className="logo">C</div>
              <div className="app-name">Connectrix</div>
            </div>
            <p>&copy; 2023 Connectrix. All rights reserved.</p>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-linkedin-in"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default LandingPage;
