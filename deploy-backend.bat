@echo off
echo 🚀 Connectrix Backend Deployment Script
echo.

echo 📋 Deployment Options:
echo 1. Railway (Recommended - Free tier available)
echo 2. Render (Alternative - Free tier available)
echo 3. Heroku (Classic option)
echo.

echo 🌐 Opening Railway Dashboard...
start https://railway.app/dashboard

echo.
echo 📚 Instructions:
echo 1. Sign in to Railway with your GitHub account
echo 2. Click "New Project"
echo 3. Select "Deploy from GitHub repo"
echo 4. Connect your repository
echo 5. Select the 'server' folder as root directory
echo 6. Add environment variables:
echo    - NODE_ENV=production
echo    - FIREBASE_PROJECT_ID=cconnect-7f562
echo    - PORT=5000
echo 7. Deploy!
echo.

echo 📖 For detailed instructions, check BACKEND_DEPLOYMENT.md
echo.

echo 🎯 After deployment:
echo 1. Copy your backend URL
echo 2. Update src/config/api.js with your backend URL
echo 3. Run: npm run build && firebase deploy --only hosting
echo.

pause
