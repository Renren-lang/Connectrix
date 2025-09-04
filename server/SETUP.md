# Connectrix Backend Setup

## 🔧 Environment Setup

### 1. Firebase Service Account
1. Copy `firebase-service-account.json.template` to `firebase-service-account.json`
2. Replace the placeholder values with your actual Firebase service account credentials
3. Get your service account key from [Firebase Console](https://console.firebase.google.com/project/cconnect-7f562/settings/serviceaccounts/adminsdk)

### 2. Environment Variables
Create a `.env` file in the server directory:
```env
NODE_ENV=development
PORT=5000
FIREBASE_PROJECT_ID=cconnect-7f562
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

## 🚀 Production Deployment

### Railway
1. Set environment variables in Railway dashboard
2. Upload `firebase-service-account.json` as a secret file
3. Deploy

### Heroku
1. Set environment variables using Heroku CLI
2. Upload service account key as config var
3. Deploy

## 🔒 Security Notes

- Never commit `firebase-service-account.json` to version control
- Use environment variables for sensitive data in production
- The service account key is required for Firebase Admin SDK
