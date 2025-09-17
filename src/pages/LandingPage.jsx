import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaRocket, FaUsers, FaLightbulb, FaArrowRight, FaCheckCircle, FaStar, FaQuoteLeft, FaPlay, FaChevronDown } from 'react-icons/fa';
import logoImage from '../components/Logo2.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleVisibility = () => {
      setIsVisible(true);
    };

    window.addEventListener('scroll', handleScroll);
    setTimeout(handleVisibility, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
            <img 
              src={logoImage} 
              alt="Connectrix Logo" 
              style={{
                height: '50px',
                width: '50px',
                objectFit: 'cover',
                borderRadius: '50%',
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
            <button 
              onClick={() => navigate('/admin-login')} 
              style={{
                background: '#dc2626',
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
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#b91c1c';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#dc2626';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
              }}
            >Admin</button>
        </div>
        </header>

        <main style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '100vh',
          padding: '0 5%',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: 'clamp(3.5rem, 7vw, 5rem)',
            fontWeight: '900',
            marginBottom: '20px',
            color: 'white',
            textShadow: '0 8px 40px rgba(0, 0, 0, 0.6)',
            animation: 'fadeInUp 1.2s ease-out 0.5s both',
            opacity: 0,
            transform: 'translateY(30px)',
            lineHeight: '1.05',
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            position: 'relative'
          }}>
            Revolutionizing Student Engagement
            <div style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '3px',
              background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '2px',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
            }}></div>
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.2vw, 1.3rem)',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '48px',
            maxWidth: '700px',
            animation: 'fadeInUp 1.2s ease-out 0.8s both',
            opacity: 0,
            transform: 'translateY(30px)',
            lineHeight: '1.6',
            fontWeight: '300',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>Join Connectrix to experience the power of alumni mentorship at Consolatrix College of Toledo City, Inc.</p>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '2rem',
            animation: 'fadeInUp 1.2s ease-out 1.1s both',
            opacity: 0,
            transform: 'translateY(30px)'
          }}>
            <button 
              onClick={() => navigate('/login')} 
              style={{
                background: '#2563eb',
                border: 'none',
                color: 'white',
                padding: '18px 45px',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '16px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 10px 40px rgba(37, 99, 235, 0.4)',
                minWidth: '200px',
                height: '60px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                e.target.style.transform = 'translateY(-3px) scale(1.02)';
                e.target.style.boxShadow = '0 12px 40px rgba(245, 158, 11, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 30px rgba(37, 99, 235, 0.4)';
              }}
            >CONNECT NOW</button>
            <button 
              onClick={() => document.getElementById('aboutSection').scrollIntoView({ behavior: 'smooth' })} 
              style={{
                background: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                color: 'white',
                padding: '16px 40px',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '16px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                minWidth: '180px',
                height: '56px',
                boxShadow: 'none',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                e.target.style.transform = 'translateY(-3px) scale(1.02)';
                e.target.style.boxShadow = '0 12px 40px rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 8px 30px rgba(255, 255, 255, 0.1)';
              }}
            >LEARN MORE</button>
          </div>

          {/* Scroll Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'rgba(255, 255, 255, 0.8)',
            animation: 'bounce 2s infinite',
            cursor: 'pointer',
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            padding: '8px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            fontSize: '12px',
            fontWeight: '500'
          }}
          onClick={() => document.getElementById('aboutSection').scrollIntoView({ behavior: 'smooth' })}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.3)';
            e.target.style.transform = 'translateX(-50%) scale(1.05)';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 0, 0, 0.2)';
            e.target.style.transform = 'translateX(-50%) scale(1)';
            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
          }}
          >
            <span style={{ fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>Scroll to explore</span>
            <FaChevronDown style={{ fontSize: '14px' }} />
          </div>
        </main>
      </div>

      {/* About Section */}
      <section id="aboutSection" style={{
        padding: '120px 0',
        background: '#2563eb',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '36px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '50px'
          }}>About Connectrix</h2>
          <p style={{
            textAlign: 'center',
            fontSize: '20px',
            color: 'white',
            marginBottom: '50px',
            maxWidth: '800px',
            margin: '0 auto 50px',
            fontWeight: '400',
            lineHeight: '1.7',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>Connectrix is a revolutionary platform designed to bridge the gap between current students and successful alumni. Our mission is to create meaningful connections that foster mentorship, career guidance, and professional growth within the Consolatrix College community.</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '30px',
              background: 'white',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px'
              }}>
                <FaGraduationCap />
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '15px'
              }}>🎓 Student-Alumni Connection</h3>
              <p style={{
                color: '#374151',
                lineHeight: '1.6'
              }}>Direct access to successful graduates who understand your journey</p>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '30px',
              background: 'white',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px'
              }}>
                <FaGraduationCap />
                      </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '15px'
              }}>💼 Career Guidance</h3>
              <p style={{
                color: '#374151',
                lineHeight: '1.6'
              }}>Get real-world advice from professionals in your field</p>
                    </div>
            <div style={{
              textAlign: 'center',
              padding: '30px',
              background: 'white',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px'
              }}>
                <FaGraduationCap />
                      </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '15px'
              }}>🤝 Networking</h3>
              <p style={{
                color: '#374151',
                lineHeight: '1.6'
              }}>Build your professional network within your school community</p>
                      </div>
                      </div>
                    </div>
      </section>

      {/* Modern Features Section */}
      <section style={{
        padding: '120px 0',
        background: '#f8fafc',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 5%'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px'
          }}>
            <h2 style={{
              fontSize: 'clamp(2.8rem, 5.5vw, 3.8rem)',
              fontWeight: '900',
              marginBottom: '24px',
              color: '#2563eb',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              letterSpacing: '-0.02em'
            }}>Powerful Features</h2>
            <p style={{
              fontSize: 'clamp(1.2rem, 2.2vw, 1.4rem)',
              color: '#2563eb',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6',
              fontWeight: '500'
            }}>Everything you need to succeed in your academic and professional journey</p>
                  </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '80px'
          }}>
            <div style={{
              background: 'white',
              padding: '2.5rem',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.1)';
            }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #dc2626, #fbbf24)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <FaLightbulb style={{ fontSize: '1.5rem', color: 'white' }} />
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#1d4ed8'
              }}>Smart Recommendations</h3>
              <p style={{
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>AI-powered system suggests the best mentors and opportunities based on your profile and goals.</p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#2563eb',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Learn more <FaArrowRight style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }} />
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '2.5rem',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.1)';
            }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <FaUsers style={{ fontSize: '1.5rem', color: 'white' }} />
                        </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#1d4ed8'
              }}>Real-time Chat</h3>
              <p style={{
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>Connect instantly with mentors through our secure, real-time messaging platform.</p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#2563eb',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Learn more <FaArrowRight style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }} />
                      </div>
                    </div>

            <div style={{
              background: 'white',
              padding: '2.5rem',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.1)';
            }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <FaRocket style={{ fontSize: '1.5rem', color: 'white' }} />
                  </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#1d4ed8'
              }}>Career Tracking</h3>
              <p style={{
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>Track your progress, set goals, and celebrate milestones with our comprehensive career dashboard.</p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#2563eb',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Learn more <FaArrowRight style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }} />
              </div>
              </div>
            </div>

          {/* CTA Section */}
          <div style={{
            background: '#2563eb',
            padding: '4rem 3rem',
            borderRadius: '30px',
            textAlign: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '200px',
              height: '200px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              zIndex: 1
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              left: '-10%',
              width: '150px',
              height: '150px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              zIndex: 1
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h3 style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 2.8rem)',
                fontWeight: '900',
                marginBottom: '1rem',
                color: 'white',
                textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                letterSpacing: '-0.02em'
              }}>Ready to Transform Your Future?</h3>
              <p style={{
                fontSize: '1.2rem',
                marginBottom: '2rem',
                opacity: 0.9,
                maxWidth: '600px',
                margin: '0 auto 2rem auto'
              }}>Join thousands of students who are already building their professional networks and accelerating their careers.</p>
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={() => navigate('/register')}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: '50px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
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
                >
                  Get Started Free
                </button>
                <button 
                  style={{
                    background: 'transparent',
                    color: 'white',
                    border: '2px solid white',
                    padding: '14px 32px',
                    borderRadius: '50px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.color = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'white';
                  }}
                >
                  Watch Demo
                </button>
              </div>
                      </div>
                      </div>
                    </div>
      </section>

      {/* Services Section */}
      <section style={{
        padding: '80px 0',
        background: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '36px',
            fontWeight: '700',
            color: '#2563eb',
            marginBottom: '50px'
          }}>Our Services</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            <div style={{
              padding: '30px',
              background: '#f8f9fa',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '15px'
              }}>Mentorship Programs</h3>
              <p style={{
                color: '#374151',
                lineHeight: '1.6'
              }}>One-on-one mentoring sessions with experienced alumni</p>
                      </div>
            <div style={{
              padding: '30px',
              background: '#f8f9fa',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '15px'
              }}>Career Workshops</h3>
              <p style={{
                color: '#374151',
                lineHeight: '1.6'
              }}>Interactive sessions on resume building and interview prep</p>
                      </div>
            <div style={{
              padding: '30px',
              background: '#f8f9fa',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '15px'
              }}>Networking Events</h3>
              <p style={{
                color: '#374151',
                lineHeight: '1.6'
              }}>Regular meetups and networking opportunities</p>
                    </div>
            <div style={{
              padding: '30px',
              background: '#f8f9fa',
              borderRadius: '10px',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#2563eb',
                marginBottom: '15px'
              }}>Resource Library</h3>
              <p style={{
                color: '#374151',
                lineHeight: '1.6'
              }}>Access to study materials and career resources</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{
        padding: '120px 0',
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.5
        }}></div>
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 5%',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px'
          }}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: '800',
              marginBottom: '24px',
              color: 'white',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>What Our Students Say</h2>
            <p style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>Real stories from students who transformed their careers with Connectrix</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            marginBottom: '60px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '2.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  fontSize: '1.5rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>A</div>
                <div>
                  <h4 style={{
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}>Alex Johnson</h4>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9rem'
                  }}>Computer Science Student</p>
                </div>
              </div>
              <div style={{
                fontSize: '1.5rem',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '1rem'
              }}>
                <FaQuoteLeft />
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: '1.6',
                fontSize: '1rem',
                fontStyle: 'italic',
                marginBottom: '1.5rem'
              }}>"Connectrix connected me with an amazing mentor who helped me land my dream internship at Google. The guidance I received was invaluable!"</p>
              <div style={{
                display: 'flex',
                color: '#ffd700'
              }}>
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
                ))}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '2.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  fontSize: '1.5rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>S</div>
                <div>
                  <h4 style={{
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}>Sarah Martinez</h4>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9rem'
                  }}>Business Administration</p>
                </div>
              </div>
              <div style={{
                fontSize: '1.5rem',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '1rem'
              }}>
                <FaQuoteLeft />
              </div>
              <p style={{
                color: 'white',
                lineHeight: '1.7',
                fontSize: '1.1rem',
                fontStyle: 'italic',
                marginBottom: '1.5rem',
                fontWeight: '400',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>"The networking events organized by Connectrix opened doors I never knew existed. I now have a strong professional network that's helping me advance my career."</p>
              <div style={{
                display: 'flex',
                color: '#ffd700'
              }}>
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
                ))}
                    </div>
                  </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '2.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  fontSize: '1.5rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>M</div>
                <div>
                  <h4 style={{
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}>Michael Chen</h4>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9rem'
                  }}>Engineering Graduate</p>
                </div>
              </div>
              <div style={{
                fontSize: '1.5rem',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '1rem'
              }}>
                <FaQuoteLeft />
              </div>
              <p style={{
                color: 'white',
                lineHeight: '1.7',
                fontSize: '1.1rem',
                fontStyle: 'italic',
                marginBottom: '1.5rem',
                fontWeight: '400',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>"As an alumni mentor, I love giving back to the community. Connectrix makes it easy to share knowledge and help the next generation succeed."</p>
              <div style={{
                display: 'flex',
                color: '#ffd700'
              }}>
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: 'white',
                marginBottom: '0.5rem'
              }}>4.9/5</div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>Average Rating</div>
            </div>
            <div>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: 'white',
                marginBottom: '0.5rem'
              }}>98%</div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>Would Recommend</div>
            </div>
            <div>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: 'white',
                marginBottom: '0.5rem'
              }}>500+</div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>Success Stories</div>
            </div>
            <div>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: 'white',
                marginBottom: '0.5rem'
              }}>24/7</div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section style={{
        padding: '80px 0',
        background: '#2563eb',
        color: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '36px',
            fontWeight: '700',
            marginBottom: '50px'
          }}>Contact Us</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '30px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '15px'
              }}>📍 Location</h3>
              <p style={{
                color: 'white',
                lineHeight: '1.6',
                fontSize: '16px',
                fontWeight: '500',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}>Consolatrix College of Toledo City, Inc.</p>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '30px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '15px'
              }}>📧 Email</h3>
              <p style={{
                color: 'white',
                lineHeight: '1.6',
                fontSize: '16px',
                fontWeight: '500',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}>connectrix@consolatrix.edu.ph</p>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '30px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '15px'
              }}>📞 Phone</h3>
              <p style={{
                color: 'white',
                lineHeight: '1.6',
                fontSize: '16px',
                fontWeight: '500',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}>+63 123 456 7890</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;