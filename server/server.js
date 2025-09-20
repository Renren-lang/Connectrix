const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

// Import security middleware
const {
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  sanitizeInput,
  validateInput,
  securityHeaders,
  requestLogger,
  errorHandler
} = require('./middleware/security');

const { verifyToken, requireRole, requireOwnershipOrRole, optionalAuth } = require('./middleware/auth');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://cconnect-7f562.web.app"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

// Security middleware (order matters!)
app.use(securityHeaders);
app.use(requestLogger);

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "https://cconnect-7f562.web.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add custom headers for private network access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
});

// Body parsing and input sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Global rate limiting
app.use('/api', apiRateLimit);

// Initialize Firebase Admin
let firebaseConfig;
if (process.env.NODE_ENV === 'production') {
  // Use environment variables in production
  console.log('🔧 Production mode: Using environment variables for Firebase');
  console.log('🔧 FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing');
  console.log('🔧 FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing');
  console.log('🔧 FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing');
  
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ Missing required Firebase environment variables');
    console.error('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }
  
  firebaseConfig = {
    credential: admin.credential.cert({
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
  };
} else {
  // Use service account file in development
  try {
    const serviceAccount = require('./firebase-service-account.json');
    firebaseConfig = {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://cconnect-7f562-default-rtdb.firebaseio.com"
    };
  } catch (error) {
    console.error('Firebase service account file not found. Please create firebase-service-account.json or set environment variables.');
    process.exit(1);
  }
}

try {
  admin.initializeApp(firebaseConfig);
  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log('🔧 Database URL:', firebaseConfig.databaseURL);
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  console.error('❌ Error details:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Store active users and their socket connections
const activeUsers = new Map();
const userSockets = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Authenticate user and join their room
  socket.on('authenticate', async (data) => {
    try {
      const { token, userId } = data;
      
      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      if (decodedToken.uid === userId) {
        // Store user connection
        activeUsers.set(userId, {
          socketId: socket.id,
          userId: userId,
          online: true,
          lastSeen: new Date()
        });
        
        userSockets.set(userId, socket.id);
        
        // Join user's personal room
        socket.join(`user_${userId}`);
        
        // Update user's online status in Firestore (create if doesn't exist)
        try {
          await db.collection('users').doc(userId).update({
            online: true,
            lastSeen: new Date()
          });
        } catch (error) {
          if (error.code === 5) { // NOT_FOUND error
            // User document doesn't exist, but don't create it here
            // The user document should have been created during the Google auth process
            // If it doesn't exist, there might be an issue with the auth flow
            console.log(`User document not found for ${userId} during socket authentication`);
            console.log('This might indicate an issue with the Google auth flow');
          } else {
            throw error; // Re-throw other errors
          }
        }
        
        socket.emit('authenticated', { success: true });
        console.log(`User ${userId} authenticated and connected`);
      } else {
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authenticated', { success: false, error: 'Authentication failed' });
    }
  });

  // Join a chat room (conversation between two users)
  socket.on('joinChat', (data) => {
    const { chatId, userId } = data;
    socket.join(`chat_${chatId}`);
    console.log(`User ${userId} joined chat ${chatId}`);
  });

  // Handle new message
  socket.on('sendMessage', async (data) => {
    try {
      const { chatId, senderId, receiverId, message, messageType = 'text' } = data;
      
      // Create chat document if it doesn't exist
      const chatRef = db.collection('chats').doc(chatId);
      const chatDoc = await chatRef.get();
      
             if (!chatDoc.exists) {
         // Create new chat
         await chatRef.set({
           participants: [senderId, receiverId],
           createdAt: new Date(),
           updatedAt: new Date(),
           lastMessage: {
             text: message,
             senderId: senderId,
             timestamp: new Date(),
             type: messageType
           }
         });
       }
      
      // Add message to chat
      const messageData = {
        senderId: senderId,
        receiverId: receiverId,
        message: message,
        type: messageType,
        timestamp: new Date(),
        read: false
      };
      
      await chatRef.collection('messages').add(messageData);
      
      // Update chat's last message
      await chatRef.update({
        lastMessage: {
          text: message,
          senderId: senderId,
          timestamp: new Date(),
          type: messageType
        },
        updatedAt: new Date()
      });
      
      // Emit message to both users
      const messageToEmit = {
        ...messageData,
        chatId: chatId,
        id: Date.now() // Temporary ID for real-time display
      };
      
      io.to(`chat_${chatId}`).emit('newMessage', messageToEmit);
      
      // Update unread count for receiver
      if (userSockets.has(receiverId)) {
        io.to(userSockets.get(receiverId)).emit('messageReceived', {
          chatId: chatId,
          unreadCount: 1
        });
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Mark message as read
  socket.on('markAsRead', async (data) => {
    try {
      const { chatId, messageIds } = data;
      
      // Update messages in Firestore
      const batch = db.batch();
      messageIds.forEach(messageId => {
        const messageRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
        batch.update(messageRef, { read: true });
      });
      
      await batch.commit();
      
      // Emit read status to other users in chat
      socket.to(`chat_${chatId}`).emit('messagesRead', { messageIds });
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(`chat_${chatId}`).emit('userTyping', { userId, isTyping });
  });

  // Handle user going offline
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Find and update user's status
    for (const [userId, userData] of activeUsers.entries()) {
      if (userData.socketId === socket.id) {
        activeUsers.delete(userId);
        userSockets.delete(userId);
        
        // Update user's online status in Firestore
        try {
          await db.collection('users').doc(userId).update({
            online: false,
            lastSeen: new Date()
          });
        } catch (error) {
          if (error.code === 5) { // NOT_FOUND error
            console.log(`User document not found for ${userId} during disconnect`);
          } else {
            console.error('Error updating user status:', error);
          }
        }
        break;
      }
    }
  });
});

// Root route - redirect to frontend
app.get('/', (req, res) => {
  res.redirect(301, 'https://cconnect-7f562.web.app');
  
});

// API Routes

// Root endpoint for basic connectivity
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Connectrix API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Save Google user to Firestore (with strict rate limiting and validation)
app.post('/api/users/google', 
  strictRateLimit,
  validateInput,
  async (req, res) => {
  try {
    const { uid, email, firstName, lastName, profilePicture, role, provider } = req.body;
    
    console.log('Server: Saving Google user:', { uid, email, firstName, lastName, role, provider });

    if (!uid || !email || !role) {
      console.log('Server: Missing required fields:', { uid: !!uid, email: !!email, role: !!role });
      return res.status(400).json({ error: 'UID, email, and role are required' });
    }

    // Create or update user in Firestore
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update existing user
      console.log('Server: Updating existing user with role:', role);
      await userRef.update({
        email: email,
        firstName: firstName,
        lastName: lastName,
        profilePicture: profilePicture,
        role: role,
        provider: provider,
        updatedAt: new Date()
      });
    } else {
      // Create new user
      console.log('Server: Creating new user with role:', role);
      await userRef.set({
        uid: uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        profilePicture: profilePicture,
        role: role,
        provider: provider,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    res.json({ success: true, message: 'User saved successfully' });

  } catch (error) {
    console.error('Error saving Google user:', error);
    res.status(500).json({ error: 'Failed to save user data' });
  }
});



app.get('/api/chats/:userId', 
  verifyToken,
  requireOwnershipOrRole('userId'),
  async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all chats where user is a participant - no ordering to avoid index requirements
    const chatsSnapshot = await db.collection('chats')
      .where('participants', 'array-contains', userId)
      .get();
    
    const chats = [];
    for (const doc of chatsSnapshot.docs) {
      const chatData = doc.data();
      
      // Get the other participant's info
      const otherUserId = chatData.participants.find(id => id !== userId);
      try {
        const userDoc = await db.collection('users').doc(otherUserId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          chats.push({
            id: doc.id,
            otherUser: {
              id: otherUserId,
              firstName: userData.firstName || 'Unknown',
              lastName: userData.lastName || 'User',
              avatar: (userData.firstName?.charAt(0) || 'U') + (userData.lastName?.charAt(0) || ''),
              online: userData.online || false
            },
            lastMessage: chatData.lastMessage,
            unreadCount: 0, // This will be calculated separately
            timestamp: chatData.lastMessage?.timestamp || chatData.createdAt || new Date()
          });
        } else {
          console.log(`User document not found for ${otherUserId}`);
        }
      } catch (error) {
        console.error(`Error fetching user data for ${otherUserId}:`, error);
      }
    }
    
    // Sort chats by timestamp in memory (most recent first)
    chats.sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return timeB - timeA;
    });
    
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    // Return empty array instead of error for better UX
    res.json([]);
  }
});

app.get('/api/messages/:chatId', 
  verifyToken,
  async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50 } = req.query;
    
    // Get messages without ordering to avoid index requirements
    const messagesSnapshot = await db.collection('chats').doc(chatId).collection('messages')
      .limit(parseInt(limit))
      .get();
    
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort messages by timestamp in memory (chronological order)
    messages.sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return timeA - timeB;
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security middleware enabled`);
  console.log(`📊 Rate limiting active`);
  console.log(`🛡️  CORS configured for production`);
});
