# CONNECTRIX Debugging Guide

## 🚨 Critical Issues Fixed

### 1. Firestore Security Rules Vulnerability
- **Issue**: Message access rules had potential security loopholes
- **Fix**: Added proper authentication checks and improved security structure
- **Location**: `firestore.rules` lines 25-26

### 2. Error Handling Improvements
- **Issue**: Silent failures in user profile fetching
- **Fix**: Added proper error throwing and handling
- **Location**: `src/contexts/AuthContext.js`

### 3. React Error Boundaries
- **Issue**: No error boundaries for React crashes
- **Fix**: Added ErrorBoundary component wrapping entire app
- **Location**: `src/components/ErrorBoundary.jsx`

## 🔍 Common Debugging Steps

### Step 1: Check Browser Console
1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Look for Firebase-related errors
4. Check Network tab for failed requests

### Step 2: Verify Firebase Configuration
```javascript
// Check if Firebase is properly initialized
console.log('Firebase config:', firebaseConfig);
console.log('Firebase app:', app);
console.log('Firestore instance:', db);
```

### Step 3: Test Authentication
```javascript
// In browser console
import { auth } from './src/firebase';
console.log('Auth state:', auth.currentUser);
```

### Step 4: Check Firestore Rules
- Verify rules are deployed: `firebase deploy --only firestore:rules`
- Test with Firebase Console Rules Playground

## 🐛 Common Issues & Solutions

### Issue 1: "Permission Denied" Errors
**Symptoms**: Users can't read/write data
**Causes**: 
- Firestore rules too restrictive
- User not authenticated
- User doesn't have required role

**Solutions**:
1. Check user authentication status
2. Verify user role in Firestore
3. Review security rules
4. Use debug utilities to log user state

### Issue 2: Authentication State Not Persisting
**Symptoms**: Users logged out unexpectedly
**Causes**:
- Firebase Auth persistence issues
- Local storage conflicts
- Race conditions in auth state

**Solutions**:
1. Check localStorage for userRole
2. Verify onAuthStateChanged is working
3. Add debug logging to auth state changes

### Issue 3: Component Not Rendering
**Symptoms**: Blank pages or missing content
**Causes**:
- Authentication loading state
- Missing user data
- Component errors

**Solutions**:
1. Check loading states
2. Verify user data exists
3. Use ErrorBoundary for component errors
4. Add debug logging to component renders

### Issue 4: Firestore Connection Issues
**Symptoms**: Data not loading, timeout errors
**Causes**:
- Network connectivity
- Firebase project configuration
- Firestore rules blocking access

**Solutions**:
1. Test Firebase connection
2. Check project ID and configuration
3. Verify Firestore is enabled
4. Test with simple queries

## 🛠️ Debug Utilities

### Using Debug Functions
```javascript
import { debugLog, debugError, debugAuthState } from './utils/debug';

// Log authentication state
debugAuthState(user, userRole);

// Log component renders
debugComponentRender('Profile', { userId: '123' });

// Log errors with context
debugError('User profile fetch', error, { userId: '123' });
```

### Performance Monitoring
```javascript
import { debugPerformance } from './utils/debug';

const startTime = performance.now();
// ... your operation
debugPerformance('User data fetch', startTime);
```

## 📱 Testing Checklist

### Authentication Testing
- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Role-based access works
- [ ] Authentication persists on refresh

### Data Access Testing
- [ ] Users can read their own data
- [ ] Users can update their own data
- [ ] Role-based data access works
- [ ] Chat/messaging permissions work
- [ ] Forum access works

### Error Handling Testing
- [ ] Invalid credentials show proper errors
- [ ] Network errors are handled gracefully
- [ ] Permission denied errors are clear
- [ ] Component errors don't crash the app

## 🔧 Development Tools

### Firebase Console
- Check Authentication users
- Monitor Firestore data
- Test security rules
- View error logs

### React Developer Tools
- Inspect component state
- Monitor props changes
- Check component hierarchy
- Profile performance

### Browser DevTools
- Console logging
- Network monitoring
- Storage inspection
- Performance profiling

## 🚀 Quick Fixes

### If App Won't Start
1. Check `npm install` completed
2. Verify Firebase config
3. Check browser console errors
4. Clear browser cache

### If Authentication Fails
1. Check Firebase project settings
2. Verify API keys are correct
3. Check Firestore rules
4. Test with Firebase console

### If Data Won't Load
1. Check Firestore rules
2. Verify user authentication
3. Check network connectivity
4. Test with simple queries

## 📞 Getting Help

### Debug Information to Collect
1. Browser console errors
2. Network request failures
3. User authentication state
4. Firestore rule violations
5. Component render issues

### Error Reporting Format
```
Error Context: [What were you doing?]
Error Message: [Exact error text]
User Role: [student/alumni]
Browser: [Chrome/Firefox/etc]
Steps to Reproduce: [1, 2, 3...]
```

## 🎯 Performance Tips

1. **Use React.memo** for expensive components
2. **Implement proper loading states**
3. **Cache frequently accessed data**
4. **Optimize Firestore queries**
5. **Monitor bundle size**

## 🔒 Security Best Practices

1. **Never expose API keys** in client code
2. **Use proper Firestore rules**
3. **Validate user input**
4. **Implement rate limiting**
5. **Regular security audits**

---

*Last updated: [Current Date]*
*Version: 1.0.0*
