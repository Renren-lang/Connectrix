#!/bin/bash

# Connectrix Deployment Script

echo "🚀 Starting Connectrix Deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Build the React app
echo "📦 Building React app for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Firebase Hosting
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -ne 0 ]; then
    echo "❌ Firebase deployment failed. Please check your Firebase configuration."
    exit 1
fi

echo "✅ Frontend deployed successfully!"
echo "🌍 Your app is live at: https://cconnect-7f562.web.app"

echo ""
echo "📋 Next Steps:"
echo "1. Deploy your backend to a cloud platform (Heroku, Railway, Render, etc.)"
echo "2. Update the API URL in src/config/api.js with your backend URL"
echo "3. Rebuild and redeploy the frontend"
echo ""
echo "📚 Check DEPLOYMENT.md for detailed deployment instructions"
echo "🛡️ Security features are enabled and configured"
echo "🎉 Happy coding!"
