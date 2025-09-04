# Connectrix Backend Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Railway (Recommended - Free Tier Available)

#### Step 1: Deploy via Railway Web Interface
1. Go to [Railway.app](https://railway.app)
2. Sign in with your GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect your GitHub repository
6. Select the `server` folder as the root directory
7. Railway will automatically detect it's a Node.js app

#### Step 2: Configure Environment Variables
In Railway dashboard, go to Variables tab and add:
```
NODE_ENV=production
FIREBASE_PROJECT_ID=cconnect-7f562
PORT=5000
```

#### Step 3: Deploy
Railway will automatically build and deploy your app.

---

### Option 2: Render (Alternative - Free Tier Available)

#### Step 1: Deploy via Render Web Interface
1. Go to [Render.com](https://render.com)



2. Sign up/Sign in
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `connectrix-api`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

#### Step 2: Configure Environment Variables
In Render dashboard, go to Environment tab and add:
```
NODE_ENV=production
FIREBASE_PROJECT_ID=cconnect-7f562
PORT=5000
```

---

### Option 3: Heroku (Classic Option)

#### Step 1: Install Heroku CLI
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
# Or install via npm:
npm install -g heroku
```

#### Step 2: Deploy
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create connectrix-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=cconnect-7f562

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

---

## 🔧 Backend Configuration

### Required Files (Already Created)
- ✅ `server/package.json` - Dependencies and scripts
- ✅ `server/server.js` - Main server file
- ✅ `server/Procfile` - Process file for Heroku
- ✅ `server/railway.json` - Railway configuration
- ✅ `server/.railwayignore` - Files to ignore

### Environment Variables Needed
```env
NODE_ENV=production
FIREBASE_PROJECT_ID=cconnect-7f562
PORT=5000
```

### API Endpoints
- `GET /api/health` - Health check
- `POST /api/users/google` - Google user registration
- `GET /api/chats/:userId` - Get user chats
- `GET /api/messages/:chatId` - Get chat messages

---

## 🛡️ Security Features Included

### Rate Limiting
- Authentication: 5 attempts per 15 minutes
- General API: 100 requests per 15 minutes
- Strict endpoints: 10 requests per 5 minutes

### Security Headers
- Helmet.js for security headers
- CORS configuration for production domains
- Input validation and sanitization
- Authentication middleware

### CORS Configuration
```javascript
origin: [
  "https://cconnect-7f562.web.app",  // Production frontend
  "http://localhost:3000"            // Development
]
```

---

## 📊 After Deployment

### 1. Get Your Backend URL
After deployment, you'll get a URL like:
- Railway: `https://connectrix-api-production.up.railway.app`
- Render: `https://connectrix-api.onrender.com`
- Heroku: `https://connectrix-api.herokuapp.com`

### 2. Update Frontend Configuration
Update `src/config/api.js`:
```javascript
const API_CONFIG = {
  development: 'http://localhost:5000',
  production: 'https://your-backend-url.com', // Update this
  // ... rest of config
};
```

### 3. Redeploy Frontend
```bash
# Build and deploy frontend with new API URL
npm run build
firebase deploy --only hosting
```

---

## 🧪 Testing Deployment

### 1. Test Health Endpoint
```bash
curl https://your-backend-url.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. Test CORS
Open browser console on your frontend and test:
```javascript
fetch('https://your-backend-url.com/api/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

### 3. Test Google Authentication
1. Go to your deployed frontend
2. Click Google login
3. Select role
4. Complete authentication
5. Verify you're redirected to dashboard

---

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
- Ensure your backend URL is added to CORS origins
- Check that environment variables are set correctly

#### 2. Firebase Authentication Errors
- Verify `FIREBASE_PROJECT_ID` is set correctly
- Ensure Firebase service account key is uploaded

#### 3. Port Issues
- Most platforms use `process.env.PORT`
- Ensure your server listens on the correct port

#### 4. Build Failures
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible

### Debug Commands
```bash
# Check logs (Railway)
railway logs

# Check logs (Heroku)
heroku logs --tail

# Check environment variables
railway variables
heroku config
```

---

## 🎯 Recommended Deployment Steps

1. **Choose Railway** (easiest and most reliable)
2. **Deploy via web interface** (more stable than CLI)
3. **Set environment variables** in dashboard
4. **Test health endpoint** to verify deployment
5. **Update frontend API URL** in `src/config/api.js`
6. **Redeploy frontend** with new API URL
7. **Test full authentication flow**

---

## 📞 Support

If you encounter issues:
1. Check the platform's documentation
2. Verify environment variables are set
3. Check server logs for errors
4. Ensure Firebase configuration is correct

**Your backend is ready for deployment! Choose your preferred platform and follow the steps above.** 🚀
