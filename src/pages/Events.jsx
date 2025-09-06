import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, where, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

function Events() {
  const { currentUser, userRole } = useAuth();
  const [activeRole, setActiveRole] = useState('student');
  const [isPostFormExpanded, setIsPostFormExpanded] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    date: '',
    location: '',
    tags: ''
  });
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Fetch events from Firebase in real-time
  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting up events listener for user:', currentUser.uid);
    
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(
      eventsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      try {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt || 0)
        }));
        
        console.log('Fetched events:', eventsData);
        setEvents(eventsData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing events data:', error);
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Error listening to events:', error);
      console.error('Error details:', error.code, error.message);
      setIsLoading(false);
    });

    return () => {
      console.log('Cleaning up events listener...');
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from events:', error);
      }
    };
  }, [currentUser]);

  // Set active role based on user role
  useEffect(() => {
    if (userRole) {
      setActiveRole(userRole);
    }
  }, [userRole]);

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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      showNotificationToast('Error', 'You must be logged in to post events.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const eventData = {
        type: formData.type,
        title: formData.title,
        company: formData.company,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        description: formData.description,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        organizerId: currentUser.uid,
        organizerName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const eventsRef = collection(db, 'events');
      const docRef = await addDoc(eventsRef, eventData);
      
      console.log('Event created with ID:', docRef.id);
      
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
      showNotificationToast('Event Posted', 'Your event has been successfully posted.');
    } catch (error) {
      console.error('Error creating event:', error);
      showNotificationToast('Error', 'Failed to post event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  const handleEventAction = async (eventId, action) => {
    if (action === 'delete') {
      if (window.confirm('Are you sure you want to delete this event?')) {
        try {
          const eventRef = doc(db, 'events', eventId);
          await deleteDoc(eventRef);
          showNotificationToast('Event Deleted', 'The event has been successfully deleted.');
        } catch (error) {
          console.error('Error deleting event:', error);
          showNotificationToast('Error', 'Failed to delete event. Please try again.');
        }
      }
    } else if (action === 'apply') {
      showNotificationToast('Application', 'Thank you for your interest! The organizer will be notified.');
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



  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    if (filters.type && event.type !== filters.type) return false;
    if (filters.location && !event.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.tags && !event.tags.some(tag => tag.toLowerCase().includes(filters.tags.toLowerCase()))) return false;
    
    if (filters.date) {
      const today = new Date();
      const eventDate = new Date(event.date);
      
      if (filters.date === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        if (event.date !== todayStr) return false;
      } else if (filters.date === 'week') {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        if (eventDate < today || eventDate > weekFromNow) return false;
      } else if (filters.date === 'month') {
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        if (eventDate < today || eventDate > monthFromNow) return false;
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
        <div className="dashboard-container">
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
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Posting...' : 'Post Event'}
                    </button>
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

          {/* Events Grid */}
          <div className="opportunities-grid">
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading events...</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map(event => {
                const typeInfo = getTypeInfo(event.type);
                return (
                  <div key={event.id} className="opportunity-card">
                    <div className="opportunity-header">
                      <span className={`opportunity-type ${typeInfo.class}`}>
                        {typeInfo.name}
                      </span>
                      <h3 className="opportunity-title">{event.title}</h3>
                      <div className="opportunity-company">
                        <i className={typeInfo.icon}></i>
                        <span>{event.company}</span>
                      </div>
                      <div className="opportunity-organizer">
                        <i className="fas fa-user"></i>
                        <span>Posted by {event.organizerName}</span>
                      </div>
                    </div>
                    <div className="opportunity-body">
                      <div className="opportunity-meta">
                        <div className="meta-item">
                          <i className="fas fa-calendar"></i>
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{event.location}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-clock"></i>
                          <span>{event.time}</span>
                        </div>
                      </div>
                      <div className="opportunity-description">
                        {event.description}
                      </div>
                      <div className="opportunity-tags">
                        {event.tags.map((tag, index) => (
                          <span key={index} className="opportunity-tag">{tag}</span>
                        ))}
                      </div>
                      <div className="opportunity-actions">
                        <button 
                          className="btn-apply"
                          onClick={() => handleEventAction(event.id, 'apply')}
                        >
                          {getActionButtonText(event.type, false)}
                        </button>
                        {currentUser && currentUser.uid === event.organizerId && (
                          <button 
                            className="btn-delete"
                            onClick={() => handleEventAction(event.id, 'delete')}
                          >
                            <i className="fas fa-trash"></i>
                            Delete
                          </button>
                        )}
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
