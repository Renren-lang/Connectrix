#!/bin/bash

# Connectrix API Security Dependencies Installation Script

echo "🛡️  Installing Connectrix API Security Dependencies..."

# Install new security packages
npm install express-rate-limit helmet validator

echo "✅ Security dependencies installed successfully!"
echo ""
echo "📦 Installed packages:"
echo "  - express-rate-limit: Rate limiting middleware"
echo "  - helmet: Security headers middleware"
echo "  - validator: Input validation and sanitization"
echo ""
echo "🚀 You can now start the server with enhanced security:"
echo "  npm start"
echo ""
echo "📚 Check SECURITY.md for detailed security documentation"
echo "🔧 Configuration available in server/config/security.js"
