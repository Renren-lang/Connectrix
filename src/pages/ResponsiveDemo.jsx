import React, { useState } from 'react';
import '../styles/responsive.css';
import '../components/ResponsiveComponents.css';

function ResponsiveDemo() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            {/* Logo Section */}
            <div className="logo">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                R
              </div>
              <span className="logo-text">ResponsiveDemo</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="nav hidden md:flex">
              <a href="#home" className="nav-item">Home</a>
              <a href="#features" className="nav-item">Features</a>
              <a href="#about" className="nav-item">About</a>
              <a href="#contact" className="nav-item">Contact</a>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:text-blue-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="container py-4">
              <nav className="flex flex-col space-y-2">
                <a href="#home" className="nav-item">Home</a>
                <a href="#features" className="nav-item">Features</a>
                <a href="#about" className="nav-item">About</a>
                <a href="#contact" className="nav-item">Contact</a>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Responsive Design
            <span className="block text-yellow-300">Made Simple</span>
          </h1>
          <p className="hero-subtitle">
            A comprehensive design system that automatically adjusts to all devices - 
            from mobile phones to large desktop screens. Built with modern CSS practices 
            including CSS Grid, Flexbox, and relative units.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg">
              Get Started
            </button>
            <button className="btn btn-secondary btn-lg">
              View Examples
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <p className="section-subtitle">
            Everything you need to build modern, responsive web applications
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card hover">
              <div className="card-header text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-gray-900">Mobile First</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-600 mb-4">
                  Designed with a mobile-first approach, ensuring perfect experience 
                  on all devices from smartphones to large desktop screens.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Touch-friendly interfaces</li>
                  <li>• Optimized for small screens</li>
                  <li>• Fast loading on mobile</li>
                </ul>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card hover">
              <div className="card-header text-center">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-gray-900">Modern CSS</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-600 mb-4">
                  Built with modern CSS features including CSS Grid, Flexbox, 
                  CSS custom properties, and relative units for maximum flexibility.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• CSS Grid layouts</li>
                  <li>• Flexbox components</li>
                  <li>• CSS custom properties</li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card hover">
              <div className="card-header text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-gray-900">Performance</h3>
              </div>
              <div className="card-body">
                <p className="text-gray-600 mb-4">
                  Optimized for performance with efficient CSS, minimal overhead, 
                  and fast rendering across all devices and browsers.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Lightweight CSS</li>
                  <li>• Fast rendering</li>
                  <li>• Cross-browser support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Grid Demo */}
      <section className="section bg-white">
        <div className="container">
          <h2 className="section-title">Responsive Grid System</h2>
          <p className="section-subtitle">
            CSS Grid that automatically adapts to different screen sizes
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div 
                key={item}
                className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {item}
                </div>
                <p className="text-gray-600 text-sm">
                  Grid Item {item}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  Responsive
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Demo */}
      <section className="section">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h2 className="section-title">Responsive Form</h2>
            <p className="section-subtitle">
              Forms that adapt to different screen sizes with proper touch targets
            </p>
            
            <div className="card">
              <div className="card-body">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea 
                      rows="4"
                      className="form-input" 
                      placeholder="Enter your message"
                    ></textarea>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button type="submit" className="btn btn-primary btn-lg flex-1">
                      Send Message
                    </button>
                    <button type="button" className="btn btn-secondary btn-lg flex-1">
                      Clear Form
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Visibility Demo */}
      <section className="section bg-gray-100">
        <div className="container">
          <h2 className="section-title">Responsive Visibility</h2>
          <p className="section-subtitle">
            Elements that show or hide based on screen size
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-100 rounded-lg">
              <p className="text-blue-800 font-medium">
                📱 This content is always visible
              </p>
            </div>
            
            <div className="hidden sm:block p-4 bg-green-100 rounded-lg">
              <p className="text-green-800 font-medium">
                💻 This content is visible on small screens and up (640px+)
              </p>
            </div>
            
            <div className="hidden md:block p-4 bg-purple-100 rounded-lg">
              <p className="text-purple-800 font-medium">
                🖥️ This content is visible on medium screens and up (768px+)
              </p>
            </div>
            
            <div className="hidden lg:block p-4 bg-yellow-100 rounded-lg">
              <p className="text-yellow-800 font-medium">
                🖥️ This content is visible on large screens and up (1024px+)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ResponsiveDemo. Built with modern responsive design principles.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ResponsiveDemo;

