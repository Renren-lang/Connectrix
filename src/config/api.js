// API configuration for Connectrix

const API_CONFIG = {
  // Development API URL
  development: 'http://localhost:5000',
  
  // Production API URL (Railway deployment)
  production: 'https://connectrix-backend-production.up.railway.app',
  
  // Get current API URL based on environment
  getBaseURL: () => {
    if (process.env.NODE_ENV === 'production') {
      return API_CONFIG.production;
    }
    return API_CONFIG.development;
  },
  
  // API endpoints
  endpoints: {
    health: '/api/health',
    googleUser: '/api/users/google',
    chats: '/api/chats',
    messages: '/api/messages'
  },
  
  // Get full API URL for an endpoint
  getURL: (endpoint) => {
    return `${API_CONFIG.getBaseURL()}${endpoint}`;
  }
};

export default API_CONFIG;
