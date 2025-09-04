# Connectrix API Security Guide

## 🛡️ Security Features Implemented

### 1. **Rate Limiting**
- **Authentication endpoints**: 5 attempts per 15 minutes
- **General API**: 100 requests per 15 minutes  
- **Strict endpoints**: 10 requests per 5 minutes
- **Prevents**: Brute force attacks, DDoS, API abuse

### 2. **Input Validation & Sanitization**
- **Email validation**: RFC compliant email format
- **Password validation**: 8-128 chars with complexity requirements
- **Name validation**: Only letters, spaces, hyphens, apostrophes
- **Role validation**: Only 'student' or 'alumni' allowed
- **XSS prevention**: All inputs are escaped and sanitized

### 3. **Authentication & Authorization**
- **Firebase ID token verification**: All protected routes require valid tokens
- **Role-based access control**: Users can only access resources they own
- **Token expiration handling**: Automatic token refresh and validation
- **Ownership verification**: Users can only access their own data

### 4. **Security Headers**
- **Helmet.js**: Comprehensive security headers
- **CSP**: Content Security Policy to prevent XSS
- **HSTS**: HTTP Strict Transport Security
- **CORS**: Configured for specific origins only

### 5. **Request Security**
- **Body size limits**: 10MB max request size
- **Request logging**: All requests logged with IP and user agent
- **Error handling**: Secure error responses without sensitive data
- **404 handling**: Proper 404 responses for unknown routes

## 🔒 Protected Endpoints

### Authentication Required
- `GET /api/chats/:userId` - Get user's chats
- `GET /api/messages/:chatId` - Get chat messages

### Public Endpoints
- `GET /api/health` - Health check
- `POST /api/users/google` - Google user registration (rate limited)

## 🚨 Security Best Practices

### For Developers
1. **Never log sensitive data** (passwords, tokens, personal info)
2. **Always validate input** on both client and server
3. **Use HTTPS only** in production
4. **Keep dependencies updated** regularly
5. **Monitor rate limit violations** for potential attacks

### For Deployment
1. **Use environment variables** for sensitive config
2. **Enable firewall** and restrict port access
3. **Use reverse proxy** (nginx) for additional security
4. **Monitor logs** for suspicious activity
5. **Regular security audits** of dependencies

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
```

### Rate Limiting
```javascript
// Customize in server/config/security.js
rateLimits: {
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  api: { windowMs: 15 * 60 * 1000, max: 100 },
  strict: { windowMs: 5 * 60 * 1000, max: 10 }
}
```

### CORS Origins
```javascript
// Add trusted domains in server/config/security.js
cors: {
  origin: [
    "http://localhost:3000",
    "https://your-domain.com"
  ]
}
```

## 🚨 Incident Response

### If Security Breach Detected
1. **Immediately** check server logs
2. **Block suspicious IPs** if needed
3. **Review rate limit violations**
4. **Check for unusual API usage patterns**
5. **Update security measures** if necessary

### Monitoring
- Monitor `/api/health` endpoint for uptime
- Check rate limit violations in logs
- Watch for failed authentication attempts
- Monitor error rates and response times

## 📊 Security Metrics

### Key Indicators
- **Authentication failure rate**: Should be < 5%
- **Rate limit violations**: Monitor for spikes
- **Error rate**: Should be < 1%
- **Response time**: Should be < 500ms average

### Log Analysis
```bash
# Check for rate limit violations
grep "Too many" server.log

# Check for authentication failures
grep "Unauthorized" server.log

# Check for errors
grep "ERROR" server.log
```

## 🔄 Regular Maintenance

### Weekly
- Review security logs
- Check for dependency updates
- Monitor rate limit patterns

### Monthly
- Security audit of dependencies
- Review and update CORS origins
- Test rate limiting effectiveness

### Quarterly
- Full security assessment
- Penetration testing
- Update security documentation

## 📞 Security Contacts

- **Security Issues**: Report to development team
- **Emergency**: Contact system administrator
- **Updates**: Check GitHub security advisories

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular monitoring and updates are essential for maintaining a secure API.
