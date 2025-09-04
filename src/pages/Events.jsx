import React, { useState } from 'react';

function Events() {
  const [activeRole, setActiveRole] = useState('student');
  const [isPostFormExpanded, setIsPostFormExpanded] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    date: '',
    location: '',
    tags: ''
  });
  const [opportunities, setOpportunities] = useState([
    {
      id: 1,
      type: 'job',
      title: 'Software Engineer',
      company: 'TechCorp Inc.',
      date: '2023-10-25',
      time: 'Full-time',
      location: 'San Francisco, CA',
      description: 'We\'re looking for a talented software engineer to join our team. The ideal candidate will have experience in modern web technologies and a passion for building scalable applications.',
      tags: ['Tech', 'Leadership', 'Full-time'],
      isApplied: false,
      isSaved: false
    },
    {
      id: 2,
      type: 'seminar',
      title: 'Digital Marketing Trends',
      company: 'Marketing Institute',
      date: '2023-11-05',
      time: '2:00 PM - 4:00 PM',
      location: 'Online Event',
      description: 'Join us for an insightful seminar on the latest digital marketing trends. Learn from industry experts about the future of marketing in the digital age.',
      tags: ['Marketing', 'Leadership', 'Online'],
      isApplied: false,
      isSaved: false
    },
    {
      id: 3,
      type: 'meetup',
      title: 'NYC Alumni Networking Event',
      company: 'Connectrix Alumni Association',
      date: '2023-10-30',
      time: '6:00 PM - 9:00 PM',
      location: 'New York, NY',
      description: 'Connect with fellow alumni in the NYC area. This networking event is a great opportunity to expand your professional network and catch up with old friends.',
      tags: ['Networking', 'Alumni', 'NYC'],
      isApplied: false,
      isSaved: false
    },
    {
      id: 4,
      type: 'job',
      title: 'Financial Analyst',
      company: 'Global Finance Ltd.',
      date: '2023-11-15',
      time: 'Full-time',
      location: 'London, UK',
      description: 'Seeking a detail-oriented financial analyst to join our team. The ideal candidate will have strong analytical skills and experience in financial modeling and forecasting.',
      tags: ['Finance', 'Analytics', 'Full-time'],
      isApplied: false,
      isSaved: false
    },
    {
      id: 5,
      type: 'seminar',
      title: 'Introduction to Artificial Intelligence',
      company: 'Tech Academy',
      date: '2023-11-10',
      time: '10:00 AM - 12:00 PM',
      location: 'Online Event',
      description: 'Learn the fundamentals of AI and machine learning in this introductory seminar. Perfect for beginners looking to understand the basics of artificial intelligence.',
      tags: ['Tech', 'AI', 'Beginner'],
      isApplied: false,
      isSaved: false
    },
    {
      id: 6,
      type: 'meetup',
      title: 'Tech Startup Mixer',
      company: 'Startup Connect',
      date: '2023-11-20',
      time: '5:30 PM - 8:30 PM',
      location: 'San Francisco, CA',
      description: 'Join fellow alumni in the tech startup scene for an evening of networking and sharing ideas. Connect with entrepreneurs, investors, and innovators.',
      tags: ['Tech', 'Startups', 'Networking'],
      isApplied: false,
      isSaved: false
    }
  ]);
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    company: '',
    date: '',
    time: '',
    location: '',
    description: '',
    tags: ''
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: ''
  });

  const handleRoleChange = (role) => {
    setActiveRole(role);
    if (role === 'student') {
      setIsPostFormExpanded(false);
    }
  };

  const togglePostForm = () => {
    if (activeRole === 'alumni') {
      setIsPostFormExpanded(!isPostFormExpanded);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    const newOpportunity = {
      id: Date.now(),
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isApplied: false,
      isSaved: false
    };

    setOpportunities(prev => [newOpportunity, ...prev]);
    
    // Reset form
    setFormData({
      type: '',
      title: '',
      company: '',
      date: '',
      time: '',
      location: '',
      description: '',
      tags: ''
    });
    
    // Collapse form
    setIsPostFormExpanded(false);
    
    // Show notification
    showNotificationToast('Opportunity Posted', 'Your opportunity has been successfully posted.');
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const applyFilters = () => {
    // Filter logic is handled in the render method
    showNotificationToast('Filters Applied', 'Your filters have been applied successfully.');
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      date: '',
      location: '',
      tags: ''
    });
    showNotificationToast('Filters Reset', 'All filters have been reset.');
  };

  const handleOpportunityAction = (opportunityId, action) => {
    setOpportunities(prev => 
      prev.map(opp => 
        opp.id === opportunityId 
          ? { ...opp, [action]: !opp[action] }
          : opp
      )
    );

    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    let message = '';
    
    if (action === 'isApplied') {
      message = `Your application for "${opportunity.title}" has been submitted.`;
    } else if (action === 'isSaved') {
      const isCurrentlySaved = opportunity[action];
      message = isCurrentlySaved 
        ? `"${opportunity.title}" has been removed from your saved items.`
        : `"${opportunity.title}" has been saved to your profile.`;
    }
    
    if (message) {
      showNotificationToast('Action Completed', message);
    }
  };

  const handleEditOpportunity = (opportunity) => {
    alert(`Edit "${opportunity.title}" - This would open an edit form in a real application.`);
  };

  const handleDeleteOpportunity = (opportunityId) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId);
    
    if (confirm(`Are you sure you want to delete "${opportunity.title}"?`)) {
      setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
      showNotificationToast('Opportunity Deleted', `"${opportunity.title}" has been deleted.`);
    }
  };

  const showNotificationToast = (title, message) => {
    setNotificationData({ title, message });
    setShowNotification(true);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const closeNotification = () => {
    setShowNotification(false);
  };



  // Filter opportunities based on current filters
  const filteredOpportunities = opportunities.filter(opportunity => {
    if (filters.type && opportunity.type !== filters.type) return false;
    if (filters.location && !opportunity.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.tags && !opportunity.tags.some(tag => tag.toLowerCase().includes(filters.tags.toLowerCase()))) return false;
    
    if (filters.date) {
      const today = new Date();
      const opportunityDate = new Date(opportunity.date);
      
      if (filters.date === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        if (opportunity.date !== todayStr) return false;
      } else if (filters.date === 'week') {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        if (opportunityDate < today || opportunityDate > weekFromNow) return false;
      } else if (filters.date === 'month') {
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        if (opportunityDate < today || opportunityDate > monthFromNow) return false;
      }
    }
    
    return true;
  });

  const getTypeInfo = (type) => {
    switch (type) {
      case 'job':
        return { class: 'type-job', name: 'Job Posting', icon: 'fas fa-building' };
      case 'seminar':
        return { class: 'type-seminar', name: 'Seminar', icon: 'fas fa-university' };
      case 'meetup':
        return { class: 'type-meetup', name: 'Alumni Meetup', icon: 'fas fa-users' };
      default:
        return { class: 'type-job', name: 'Opportunity', icon: 'fas fa-briefcase' };
    }
  };

  const getActionButtonText = (type, isApplied) => {
    if (isApplied) return 'Applied';
    switch (type) {
      case 'job': return 'Apply';
      case 'seminar': return 'Register';
      case 'meetup': return 'RSVP';
      default: return 'Apply';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <>
      

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Events & Opportunities</h1>
            <p className="page-subtitle">Discover job postings, seminars, and alumni meetups</p>
            

          </div>

          {/* Role Toggle */}
          <div className="role-toggle">
            <div 
              className={`role-option ${activeRole === 'student' ? 'active' : ''}`}
              onClick={() => handleRoleChange('student')}
            >
              <i className="fas fa-user-graduate"></i> Student View
            </div>
            <div 
              className={`role-option ${activeRole === 'alumni' ? 'active' : ''}`}
              onClick={() => handleRoleChange('alumni')}
            >
              <i className="fas fa-briefcase"></i> Alumni View
            </div>
          </div>

          {/* Post Opportunity Form (Alumni Only) */}
          {activeRole === 'alumni' && (
            <div className={`post-opportunity ${activeRole === 'alumni' ? 'active' : ''}`}>
              <div className="post-header" onClick={togglePostForm}>
                <h3 className="post-title">Post a New Opportunity</h3>
                <i className={`fas fa-chevron-down post-toggle ${isPostFormExpanded ? 'expanded' : ''}`}></i>
              </div>
              <div className={`post-body ${isPostFormExpanded ? 'expanded' : ''}`}>
                <form onSubmit={handleFormSubmit}>
                  <div className="form-group">
                    <label className="form-label">Opportunity Type</label>
                    <select 
                      id="opportunityType"
                      name="type"
                      className="form-control" 
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select type</option>
                      <option value="job">Job Posting</option>
                      <option value="seminar">Seminar</option>
                      <option value="meetup">Alumni Meetup</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input 
                      id="opportunityTitle"
                      type="text" 
                      className="form-control" 
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter title" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company/Organization</label>
                    <input 
                      id="opportunityCompany"
                      type="text" 
                      className="form-control" 
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Enter company or organization" 
                      required 
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input 
                        id="opportunityDate"
                        type="date" 
                        className="form-control" 
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time</label>
                      <input 
                        id="opportunityTime"
                        type="time" 
                        className="form-control" 
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input 
                      id="opportunityLocation"
                      type="text" 
                      className="form-control" 
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Enter location" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      id="opportunityDescription"
                      className="form-control" 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter description" 
                      required
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags (comma separated)</label>
                    <input 
                      id="opportunityTags"
                      type="text" 
                      className="form-control" 
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="e.g., Marketing, Tech, Leadership" 
                    />
                  </div>
                  <div className="form-group">
                    <button type="submit" className="btn btn-primary">Post Opportunity</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className="filters-section">
            <h2 className="filters-title">Filter Opportunities</h2>
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">Type</label>
                <select 
                  id="filterType"
                  name="filterType"
                  className="filter-select" 
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="job">Job Posting</option>
                  <option value="seminar">Seminar</option>
                  <option value="meetup">Alumni Meetup</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Date</label>
                <select 
                  id="filterDate"
                  name="filterDate"
                  className="filter-select" 
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Location</label>
                <select 
                  id="filterLocation"
                  name="filterLocation"
                  className="filter-select" 
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                >
                  <option value="">All Locations</option>
                  <option value="online">Online</option>
                  <option value="new-york">New York</option>
                  <option value="san-francisco">San Francisco</option>
                  <option value="london">London</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Tags</label>
                <select 
                  id="filterTags"
                  name="filterTags"
                  className="filter-select" 
                  value={filters.tags}
                  onChange={(e) => handleFilterChange('tags', e.target.value)}
                >
                  <option value="">All Tags</option>
                  <option value="tech">Tech</option>
                  <option value="marketing">Marketing</option>
                  <option value="finance">Finance</option>
                  <option value="leadership">Leadership</option>
                </select>
              </div>
            </div>
            <div className="filter-actions">
              <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
              <button className="btn btn-outline" onClick={resetFilters}>Reset</button>
            </div>
          </div>

          {/* Opportunities Grid */}
          <div className="opportunities-grid">
            {filteredOpportunities.length > 0 ? (
              filteredOpportunities.map(opportunity => {
                const typeInfo = getTypeInfo(opportunity.type);
                return (
                  <div key={opportunity.id} className="opportunity-card">
                    <div className="opportunity-header">
                      <span className={`opportunity-type ${typeInfo.class}`}>
                        {typeInfo.name}
                      </span>
                      <h3 className="opportunity-title">{opportunity.title}</h3>
                      <div className="opportunity-company">
                        <i className={typeInfo.icon}></i>
                        <span>{opportunity.company}</span>
                      </div>
                    </div>
                    <div className="opportunity-body">
                      <div className="opportunity-meta">
                        <div className="meta-item">
                          <i className="fas fa-calendar"></i>
                          <span>{formatDate(opportunity.date)}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{opportunity.location}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-clock"></i>
                          <span>{opportunity.time}</span>
                        </div>
                      </div>
                      <div className="opportunity-description">
                        {opportunity.description}
                      </div>
                      <div className="opportunity-tags">
                        {opportunity.tags.map((tag, index) => (
                          <span key={index} className="opportunity-tag">{tag}</span>
                        ))}
                      </div>
                      <div className="opportunity-actions">
                        <button 
                          className={`btn-apply ${opportunity.isApplied ? 'applied' : ''}`}
                          onClick={() => handleOpportunityAction(opportunity.id, 'isApplied')}
                        >
                          {getActionButtonText(opportunity.type, opportunity.isApplied)}
                        </button>
                        <button 
                          className={`btn-save ${opportunity.isSaved ? 'saved' : ''}`}
                          onClick={() => handleOpportunityAction(opportunity.id, 'isSaved')}
                        >
                          {opportunity.isSaved ? 'Saved' : 'Save'}
                        </button>
                        {activeRole === 'alumni' && (
                          <>
                            <button 
                              className="btn-edit"
                              onClick={() => handleEditOpportunity(opportunity)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-delete"
                              onClick={() => handleDeleteOpportunity(opportunity.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-search"></i>
                </div>
                <h3 className="empty-title">No opportunities found</h3>
                <p className="empty-message">Try adjusting your filters to see more results.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Notification Toast */}
      {showNotification && (
        <div className="notification-toast show">
          <div className="notification-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="notification-content">
            <div className="notification-title">{notificationData.title}</div>
            <div className="notification-message">{notificationData.message}</div>
          </div>
          <div className="notification-close" onClick={closeNotification}>
            <i className="fas fa-times"></i>
          </div>
        </div>
      )}
    </>
  );
}

export default Events;
