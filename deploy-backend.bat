@echo off
echo 🚀 CONNECTRIX Backend Deployment Options
echo.

echo ✅ Frontend is already deployed at: https://cconnect-7f562.web.app
echo.

echo 📋 Choose your backend deployment method:
echo.
echo 1. Railway (Recommended - Easy setup)
echo 2. Heroku (Alternative)
echo 3. Render (Free tier available)
echo 4. Manual deployment instructions
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto railway
if "%choice%"=="2" goto heroku
if "%choice%"=="3" goto render
if "%choice%"=="4" goto manual
goto invalid

:railway
echo.
echo 🚂 Railway Deployment Instructions:
echo.
echo 1. Go to https://railway.app
echo 2. Sign up/Login with GitHub
echo 3. Click "New Project" → "Deploy from GitHub repo"
echo 4. Select your CONNECTRIX repository
echo 5. Set the root directory to "server"
echo 6. Add these environment variables:
echo    - NODE_ENV=production
echo    - PORT=5000
echo    - FIREBASE_PROJECT_ID=cconnect-7f562
echo    - FRONTEND_URL=https://cconnect-7f562.web.app
echo 7. Deploy!
echo.
echo Your backend will be available at: https://your-app-name.railway.app
goto end

:heroku
echo.
echo 🟣 Heroku Deployment Instructions:
echo.
echo 1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
echo 2. Run: heroku login
echo 3. Run: heroku create connectrix-api
echo 4. Run: heroku config:set NODE_ENV=production
echo 5. Run: heroku config:set FIREBASE_PROJECT_ID=cconnect-7f562
echo 6. Run: heroku config:set FRONTEND_URL=https://cconnect-7f562.web.app
echo 7. Run: git subtree push --prefix=server heroku main
echo.
echo Your backend will be available at: https://connectrix-api.herokuapp.com
goto end

:render
echo.
echo 🎨 Render Deployment Instructions:
echo.
echo 1. Go to https://render.com
echo 2. Sign up/Login with GitHub
echo 3. Click "New" → "Web Service"
echo 4. Connect your GitHub repository
echo 5. Set these settings:
echo    - Root Directory: server
echo    - Build Command: npm install
echo    - Start Command: npm start
echo 6. Add environment variables:
echo    - NODE_ENV=production
echo    - PORT=5000
echo    - FIREBASE_PROJECT_ID=cconnect-7f562
echo    - FRONTEND_URL=https://cconnect-7f562.web.app
echo 7. Deploy!
echo.
echo Your backend will be available at: https://your-app-name.onrender.com
goto end

:manual
echo.
echo 📖 Manual Deployment Instructions:
echo.
echo 1. Choose any cloud platform (AWS, Google Cloud, DigitalOcean, etc.)
echo 2. Create a Node.js server instance
echo 3. Upload the 'server' folder contents
echo 4. Install dependencies: npm install
echo 5. Set environment variables:
echo    - NODE_ENV=production
echo    - PORT=5000
echo    - FIREBASE_PROJECT_ID=cconnect-7f562
echo    - FRONTEND_URL=https://cconnect-7f562.web.app
echo 6. Start the server: npm start
echo.
goto end

:invalid
echo ❌ Invalid choice. Please run the script again and choose 1-4.
goto end

:end
echo.
echo 📝 After deploying your backend:
echo 1. Note down your backend URL
echo 2. Update src/config/api.js with your backend URL
echo 3. Run: npm run build
echo 4. Run: firebase deploy --only hosting
echo.
echo 🎉 Your full-stack app will be live!
echo.
pause