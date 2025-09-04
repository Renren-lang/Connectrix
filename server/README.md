# Connectrix Server

Real-time messaging backend server using Socket.IO and Firebase.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Firebase Service Account**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Generate new private key
   - Save as `firebase-service-account.json` in this directory

3. **Environment Variables**
   Create a `.env` file:
   ```
   PORT=5000
   NODE_ENV=development
   ```

4. **Run Server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Features

- Real-time messaging with Socket.IO
- Firebase authentication integration
- Chat rooms and private messaging
- Typing indicators
- Online/offline status
- Message read receipts
- File sharing support

## API Endpoints

- `GET /api/chats/:userId` - Get user's chats
- `GET /api/messages/:chatId` - Get chat messages

## Socket Events

- `authenticate` - User authentication
- `joinChat` - Join chat room
- `sendMessage` - Send message
- `markAsRead` - Mark messages as read
- `typing` - Typing indicator
