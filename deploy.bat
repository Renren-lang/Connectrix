@echo off
echo 🚀 Starting Connectrix Deployment...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI is not installed. Please install it first:
    echo npm install -g firebase-tools
    pause
    exit /b 1
)

REM Build the React app
echo 📦 Building React app for production...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix the errors and try again.
    pause
    exit /b 1
)

echo ✅ Build completed successfully!

REM Deploy to Firebase Hosting
echo 🌐 Deploying to Firebase Hosting...
call firebase deploy --only hosting

if %errorlevel% neq 0 (
    echo ❌ Firebase deployment failed. Please check your Firebase configuration.
    pause
    exit /b 1
)

echo ✅ Frontend deployed successfully!
echo 🌍 Your app is live at: https://cconnect-7f562.web.app

echo.
echo 📋 Next Steps:
echo 1. Deploy your backend to a cloud platform (Heroku, Railway, Render, etc.)
echo 2. Update the API URL in src/config/api.js with your backend URL
echo 3. Rebuild and redeploy the frontend
echo.
echo 📚 Check DEPLOYMENT.md for detailed deployment instructions
echo 🛡️ Security features are enabled and configured
echo 🎉 Happy coding!

pause
