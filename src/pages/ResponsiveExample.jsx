import React, { useState } from 'react';
import { 
  ResponsiveHeader, 
  ResponsiveCard, 
  ResponsiveButton, 
  ResponsiveInput, 
  ResponsiveGrid, 
  ResponsiveContainer, 
  ResponsiveHero, 
  ResponsiveSection,
  ResponsiveModal,
  ResponsiveNavigation,
  ResponsiveShow,
  ResponsiveHide,
  ResponsiveSpacer,
  ResponsiveDivider
} from '../components/ResponsiveComponents';
import '../styles/responsive.css';
import '../components/ResponsiveComponents.css';

function ResponsiveExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const navigationItems = [
    { label: 'Home', href: '#', icon: '🏠' },
    { label: 'About', href: '#', icon: 'ℹ️' },
    { label: 'Services', href: '#', icon: '⚙️' },
    { label: 'Contact', href: '#', icon: '📞' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive Header */}
      <ResponsiveHeader
        logo="https://via.placeholder.com/40x40/2563eb/ffffff?text=C"
        title="ResponsiveApp"
        navigation={
          <ResponsiveNavigation 
            items={navigationItems}
            orientation="horizontal"
          />
        }
      />

      {/* Hero Section */}
      <ResponsiveHero
        title="Modern Responsive Design"
        subtitle="Built with mobile-first approach using CSS Grid, Flexbox, and modern responsive practices. Works perfectly on all devices from mobile phones to large desktop screens."
        actions={
          <>
            <ResponsiveButton 
              variant="primary" 
              size="lg"
              onClick={() => setIsModalOpen(true)}
            >
              Get Started
            </ResponsiveButton>
            <ResponsiveButton 
              variant="outline" 
              size="lg"
            >
              Learn More
            </ResponsiveButton>
          </>
        }
        background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      />

      {/* Features Section */}
      <ResponsiveSection
        title="Responsive Features"
        subtitle="Everything you need for modern web development"
      >
        <ResponsiveGrid cols={3} gap="lg">
          <ResponsiveCard
            header={
              <div className="text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-gray-900">Mobile First</h3>
              </div>
            }
            className="text-center"
          >
            <p className="text-gray-600 mb-4">
              Designed with mobile-first approach ensuring perfect experience on all devices.
            </p>
            <ResponsiveButton variant="outline" size="sm">
              Learn More
            </ResponsiveButton>
          </ResponsiveCard>

          <ResponsiveCard
            header={
              <div className="text-center">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-gray-900">Modern CSS</h3>
              </div>
            }
            className="text-center"
          >
            <p className="text-gray-600 mb-4">
              Uses CSS Grid, Flexbox, and CSS custom properties for modern layouts.
            </p>
            <ResponsiveButton variant="outline" size="sm">
              Learn More
            </ResponsiveButton>
          </ResponsiveCard>

          <ResponsiveCard
            header={
              <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-gray-900">Performance</h3>
              </div>
            }
            className="text-center"
          >
            <p className="text-gray-600 mb-4">
              Optimized for performance with efficient CSS and responsive images.
            </p>
            <ResponsiveButton variant="outline" size="sm">
              Learn More
            </ResponsiveButton>
          </ResponsiveCard>
        </ResponsiveGrid>
      </ResponsiveSection>

      {/* Form Section */}
      <ResponsiveSection
        title="Contact Form"
        subtitle="See how forms adapt to different screen sizes"
      >
        <ResponsiveContainer maxWidth="lg">
          <ResponsiveCard>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveInput
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
                <ResponsiveInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <ResponsiveInput
                label="Message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter your message"
                required
              />

              <div className="flex flex-col sm:flex-row gap-4">
                <ResponsiveButton 
                  type="submit" 
                  variant="primary" 
                  size="lg"
                  fullWidth
                >
                  Send Message
                </ResponsiveButton>
                <ResponsiveButton 
                  type="button" 
                  variant="secondary" 
                  size="lg"
                  fullWidth
                >
                  Clear Form
                </ResponsiveButton>
              </div>
            </form>
          </ResponsiveCard>
        </ResponsiveContainer>
      </ResponsiveSection>

      {/* Responsive Show/Hide Examples */}
      <ResponsiveSection
        title="Responsive Visibility"
        subtitle="Elements that show/hide based on screen size"
      >
        <ResponsiveContainer maxWidth="lg">
          <div className="space-y-4">
            <ResponsiveShow breakpoint="sm">
              <div className="p-4 bg-blue-100 rounded-lg">
                <p className="text-blue-800 font-medium">
                  📱 This content is visible on small screens and up (640px+)
                </p>
              </div>
            </ResponsiveShow>

            <ResponsiveShow breakpoint="md">
              <div className="p-4 bg-green-100 rounded-lg">
                <p className="text-green-800 font-medium">
                  💻 This content is visible on medium screens and up (768px+)
                </p>
              </div>
            </ResponsiveShow>

            <ResponsiveShow breakpoint="lg">
              <div className="p-4 bg-purple-100 rounded-lg">
                <p className="text-purple-800 font-medium">
                  🖥️ This content is visible on large screens and up (1024px+)
                </p>
              </div>
            </ResponsiveShow>

            <ResponsiveHide breakpoint="md">
              <div className="p-4 bg-yellow-100 rounded-lg">
                <p className="text-yellow-800 font-medium">
                  📱 This content is hidden on medium screens and up (768px+)
                </p>
              </div>
            </ResponsiveHide>
          </div>
        </ResponsiveContainer>
      </ResponsiveSection>

      {/* Grid Examples */}
      <ResponsiveSection
        title="Responsive Grid System"
        subtitle="CSS Grid that adapts to different screen sizes"
      >
        <ResponsiveContainer maxWidth="xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div 
                key={item}
                className="p-6 bg-white rounded-lg shadow-md text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {item}
                </div>
                <p className="text-gray-600 text-sm">
                  Grid Item {item}
                </p>
              </div>
            ))}
          </div>
        </ResponsiveContainer>
      </ResponsiveSection>

      {/* Responsive Modal */}
      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Responsive Modal"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This modal is fully responsive and adapts to different screen sizes.
            On mobile devices, it takes up most of the screen width, while on
            larger screens it maintains a reasonable maximum width.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResponsiveInput
              label="Name"
              placeholder="Enter your name"
            />
            <ResponsiveInput
              label="Email"
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <ResponsiveButton 
              variant="primary" 
              fullWidth
              onClick={() => setIsModalOpen(false)}
            >
              Submit
            </ResponsiveButton>
            <ResponsiveButton 
              variant="secondary" 
              fullWidth
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveModal>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <ResponsiveContainer maxWidth="xl">
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
          <ResponsiveDivider className="my-8" />
          <div className="text-center text-gray-400">
            <p>&copy; 2024 ResponsiveApp. All rights reserved.</p>
          </div>
        </ResponsiveContainer>
      </footer>
    </div>
  );
}

export default ResponsiveExample;

