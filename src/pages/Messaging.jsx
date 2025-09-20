import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { createMessageNotification } from '../utils/notifications';
import './Messaging.css';

function Messaging() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Feature flag to disable online status tracking if needed
  // IMPORTANT: Set to false to prevent Firebase permission errors
  // Set to true only if you have proper Firestore rules for userStatus collection
  const ENABLE_ONLINE_STATUS = false; // Set to true to enable online status tracking
  
  // Helper function to check if online status operations should be attempted
  const shouldAttemptOnlineStatus = () => {
    return currentUser && ENABLE_ONLINE_STATUS;
  };
  
  // Chat state
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  
  // Debug logging for messages state
  useEffect(() => {
    console.log('Messages state changed:', messages, 'Type:', typeof messages, 'Is Array:', Array.isArray(messages));
  }, [messages]);

  // Debug logging for current user
  useEffect(() => {
    if (currentUser) {
      console.log('Current user data:', {
        uid: currentUser.uid,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        displayName: currentUser.displayName,
        email: currentUser.email,
        role: currentUser.role
      });
    }
  }, [currentUser]);

  // Refresh user profile data when needed
  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        // This will trigger a re-render with updated profile data
        // The AuthContext will handle fetching the latest data
        console.log('Refreshing user profile data...');
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  // Set up online status tracking
  const setupOnlineStatus = async () => {
    if (!shouldAttemptOnlineStatus()) return;
    
    try {
      const userStatusRef = doc(db, 'userStatus', currentUser.uid);
      
      // Set user as online
      await setDoc(userStatusRef, {
        uid: currentUser.uid,
        online: true,
        lastSeen: serverTimestamp(),
        role: currentUser.role || 'user'
      });
      
      console.log('Online status set up for user:', currentUser.uid);
    } catch (error) {
      // Handle permission errors gracefully - online status is optional
      console.warn('Could not set up online status (this is normal if user lacks permissions):', error.message);
    }
  };

  // Clean up online status when component unmounts
  const cleanupOnlineStatus = async () => {
    if (!shouldAttemptOnlineStatus()) return;
    
    try {
      const userStatusRef = doc(db, 'userStatus', currentUser.uid);
      await setDoc(userStatusRef, {
        uid: currentUser.uid,
        online: false,
        lastSeen: serverTimestamp(),
        role: currentUser.role || 'user'
      });
      console.log('User marked as offline:', currentUser.uid);
    } catch (error) {
      // Handle permission errors gracefully - online status is optional
      console.warn('Could not clean up online status (this is normal if user lacks permissions):', error.message);
    }
  };

  // Update user activity in Firestore
  const updateUserActivity = async () => {
    if (!shouldAttemptOnlineStatus()) return;
    
    try {
      const userStatusRef = doc(db, 'userStatus', currentUser.uid);
      await setDoc(userStatusRef, {
        uid: currentUser.uid,
        online: true,
        lastSeen: serverTimestamp(),
        role: currentUser.role || 'user'
      }, { merge: true });
      console.log('User activity updated:', currentUser.uid);
    } catch (error) {
      // Handle permission errors gracefully - online status is optional
      console.warn('Could not update user activity (this is normal if user lacks permissions):', error.message);
    }
  };

  // Listen for online status changes of other users
  const setupOnlineStatusListener = () => {
    if (!shouldAttemptOnlineStatus() || chats.length === 0) return () => {};
    
    try {
      // Get all other user IDs from chats
      const otherUserIds = chats
        .flatMap(chat => chat.participants || [])
        .filter(id => id !== currentUser.uid);
      
      if (otherUserIds.length === 0) return () => {};
      
      const statusRef = collection(db, 'userStatus');
      const q = query(statusRef, where('uid', 'in', otherUserIds));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const statusData = change.doc.data();
          const userId = statusData.uid;
          
          // Update the chat with online status
          setChats(prevChats => 
            prevChats.map(chat => {
              if (chat.participants?.includes(userId)) {
                return {
                  ...chat,
                  otherUserOnline: statusData.online || false,
                  otherUserLastSeen: statusData.lastSeen
                };
              }
              return chat;
            })
          );
        });
      });
      
      return unsubscribe;
    } catch (error) {
      // Handle permission errors gracefully - online status is optional
      console.warn('Could not set up online status listener (this is normal if user lacks permissions):', error.message);
      return () => {};
    }
  };

  // Listen for navigation events to refresh profile data
  useEffect(() => {
    const handleFocus = () => {
      // Refresh profile data when user returns to the chat
      refreshUserProfile();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshUserProfile]);

  // Set up online status when component mounts
  useEffect(() => {
    if (shouldAttemptOnlineStatus()) {
      // Only attempt online status setup if we have a user and feature is enabled
      // We'll let it fail silently if permissions are missing
      setupOnlineStatus();
      
      // Set up periodic status updates (every 2 minutes)
      const statusInterval = setInterval(() => {
        updateUserActivity();
      }, 120000); // 2 minutes
      
      // Clean up online status when component unmounts
      return () => {
        cleanupOnlineStatus();
        
        // Clear interval
        clearInterval(statusInterval);
      };
    }
    // When ENABLE_ONLINE_STATUS is false, no Firebase operations are performed
    // All users will appear as offline, but messaging functionality remains intact
  }, [currentUser, setupOnlineStatus, updateUserActivity, cleanupOnlineStatus]);

  // Set up online status listener when chats change
  useEffect(() => {
    if (chats.length > 0 && shouldAttemptOnlineStatus()) {
      try {
        const unsubscribe = setupOnlineStatusListener();
        if (unsubscribe) {
          return unsubscribe;
        }
        // Return empty cleanup function if no listener was set up
        return () => {};
      } catch (error) {
        // Handle permission errors gracefully - online status is optional
        console.warn('Could not set up online status listener (this is normal if user lacks permissions):', error.message);
        // Return empty cleanup function
        return () => {};
      }
    }
  }, [chats, currentUser, shouldAttemptOnlineStatus, setupOnlineStatusListener]);

  // Set up activity tracking to keep user marked as online
  useEffect(() => {
    if (!shouldAttemptOnlineStatus()) return;
    
    // Only update activity when user is actively typing or sending messages
    const handleMessageActivity = () => {
      updateUserActivity();
    };
    
    // Add event listener for message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('input', handleMessageActivity);
    }
    
    // Cleanup
    return () => {
      if (messageInput) {
        messageInput.removeEventListener('input', handleMessageActivity);
      }
    };
  }, [currentUser, shouldAttemptOnlineStatus, updateUserActivity]);
  
  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  
  const chatMessagesRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'],
    people: ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '🧑‍🦱', '👨‍🦱', '👩‍🦰', '🧑‍🦰', '👨‍🦰', '👱‍♀️', '👱', '👩‍🦳', '🧑‍🦳', '👨‍🦳', '👩‍🦲', '🧑‍🦲', '👨‍🦲', '🧔', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳', '👮‍♀️', '👮', '👷‍♀️', '👷', '💂‍♀️', '💂', '🕵️‍♀️', '🕵️', '👩‍⚕️', '🧑‍⚕️', '👨‍⚕️', '👩‍🌾', '🧑‍🌾', '👨‍🌾', '👩‍🍳', '🧑‍🍳', '👨‍🍳', '👩‍🎓', '🧑‍🎓', '👨‍🎓', '👩‍🎤', '🧑‍🎤', '👨‍🎤', '👩‍🏫', '🧑‍🏫', '👨‍🏫', '👩‍🏭', '🧑‍🏭', '👨‍🏭', '👩‍💻', '🧑‍💻', '👨‍💻', '👩‍💼', '🧑‍💼', '👨‍💼', '👩‍🔧', '🧑‍🔧', '👨‍🔧', '👩‍🔬', '🧑‍🔬', '👨‍🔬', '👩‍🎨', '🧑‍🎨', '👨‍🎨', '👩‍🚒', '🧑‍🚒', '👨‍🚒', '👩‍✈️', '🧑‍✈️', '👨‍✈️', '👩‍🚀', '🧑‍🚀', '👨‍🚀', '👩‍⚖️', '🧑‍⚖️', '👨‍⚖️', '👰', '🤵', '👸', '🤴', '🥷', '🦸‍♀️', '🤸', '🦹‍♀️', '🦹', '🤶', '🎅', '🧙‍♀️', '🧙', '🧝‍♀️', '🧝']
  };

     // Initialize and fetch chats
   useEffect(() => {
     if (!currentUser) return;
     
     console.log('Setting up chat listener for user:', currentUser.uid);
     
     // Set up real-time listener for chats
     const unsubscribe = onSnapshot(
       query(
         collection(db, 'chats'),
         where('participants', 'array-contains', currentUser.uid),
         orderBy('lastMessageTime', 'desc')
       ),
       async (snapshot) => {
         try {
         const chatsData = await Promise.all(snapshot.docs.map(async (doc) => {
           const data = doc.data();
           // Find the other participant (not current user)
           const otherUserId = data.participants?.find(id => id !== currentUser.uid);
           
           if (!otherUserId) {
             console.warn('Chat missing other participant:', doc.id);
             return null;
           }
           
           // Fetch real user details from Firestore
           const otherUserDetails = await fetchUserDetails(otherUserId);
           
           console.log('Real-time chat update:', { 
             chatId: doc.id, 
             participants: data.participants, 
             participantDetails: data.participantDetails,
             otherUserId,
             otherUserDetails,
             currentUserId: currentUser.uid
           });
           
           return {
             id: doc.id,
             ...data,
             otherUser: {
               id: otherUserId,
               name: otherUserDetails.name,
               role: otherUserDetails.role
             }
           };
         }));
         
         const validChats = chatsData.filter(Boolean); // Remove any null entries
         
         // Simply replace the chats array to prevent duplicates
         setChats(validChats);
         
         setIsLoading(false);
         } catch (error) {
           console.error('Error processing chat data:', error);
           setIsLoading(false);
         }
       },
       (error) => {
         console.error('Error listening to chats:', error);
         console.error('Error details:', error.code, error.message);
         setIsLoading(false);
       }
     );

     return () => {
       console.log('Cleaning up chat listener...');
       try {
         unsubscribe();
       } catch (error) {
         console.error('Error unsubscribing from chats:', error);
       }
     };
   }, [currentUser]);

    // Create or find a chat with another user
  const createOrFindChat = async (otherUserId, otherUserName, otherUserRole = 'student') => {
    try {
      // Check if we already have this chat in our local state first
      const existingLocalChat = chats.find(chat => 
        chat.participants.includes(otherUserId)
      );
      
      if (existingLocalChat) {
        // Chat exists locally, just select it
        setActiveChat(existingLocalChat);
        fetchMessages(existingLocalChat.id);
        return existingLocalChat;
      }

      // If not in local state, check Firestore
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const existingChat = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(otherUserId);
      });

      if (existingChat) {
        // Chat exists in Firestore, fetch it and select it
        const chatData = existingChat.data();
        const otherUserDetails = chatData.participantDetails?.[otherUserId] || {};
        
        const existingChatObj = {
          id: existingChat.id,
          ...chatData,
          otherUser: {
            id: otherUserId,
            name: otherUserDetails.name || 'Unknown User',
            role: otherUserDetails.role || 'user'
          }
        };

        // Add to local chats if not already there
        if (!chats.find(chat => chat.id === existingChat.id)) {
          setChats(prev => [...prev, existingChatObj]);
        }

        setActiveChat(existingChatObj);
        fetchMessages(existingChat.id);
        return existingChatObj;
      }

      // Fetch real user details from Firestore
      const otherUserDetails = await fetchUserDetails(otherUserId);
      console.log('Fetched other user details for chat:', otherUserDetails);

      // Create new chat only if it doesn't exist anywhere
      const chatData = {
        participants: [currentUser.uid, otherUserId],
        participantDetails: {
          [currentUser.uid]: {
            name: (() => {
              const firstName = currentUser.firstName || '';
              const lastName = currentUser.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim();
              
              // Better fallback logic
              let finalName = fullName;
              if (!finalName && currentUser.displayName) {
                finalName = currentUser.displayName;
              }
              if (!finalName && currentUser.email) {
                finalName = currentUser.email.split('@')[0];
              }
              if (!finalName) {
                finalName = 'User';
              }
              
              console.log('Setting current user name:', { firstName, lastName, fullName, displayName: currentUser.displayName, email: currentUser.email, finalName });
              return finalName;
            })(),
            role: currentUser.role || 'user'
          },
          [otherUserId]: {
            name: otherUserDetails.name,
            role: otherUserDetails.role
          }
        },
        lastMessage: null,
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      console.log('Creating new chat with data:', chatData);

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      
      // Create the chat object for local state
      const newChat = {
        id: chatRef.id,
        ...chatData,
        otherUser: {
          id: otherUserId,
          name: otherUserDetails.name,
          role: otherUserDetails.role
        }
      };

      // Add to local chats
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
      setMessages([]);

      return newChat;
    } catch (error) {
      console.error('Error creating/finding chat:', error);
    }
  };

  // Fetch user's chats
  const fetchChats = async () => {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid),
        orderBy('lastMessageTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const chatsData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        // Find the other participant (not current user)
        const otherUserId = data.participants?.find(id => id !== currentUser.uid);
        
        if (!otherUserId) {
          console.warn('Chat missing other participant:', doc.id);
          return null;
        }
        
        // Fetch real user details from Firestore
        const otherUserDetails = await fetchUserDetails(otherUserId);
        
        console.log('Processing chat:', { 
          chatId: doc.id, 
          participants: data.participants, 
          participantDetails: data.participantDetails,
          otherUserId,
          otherUserDetails,
          currentUserId: currentUser.uid
        });
        
        return {
          id: doc.id,
          ...data,
          otherUser: {
            id: otherUserId,
            name: otherUserDetails.name,
            role: otherUserDetails.role
          }
        };
      }));
      
      const validChats = chatsData.filter(Boolean); // Remove any null entries
      setChats(validChats);
      if (validChats.length > 0 && !activeChat) {
        setActiveChat(validChats[0]);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId) => {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const querySnapshot = await getDocs(q);
      const messagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // Fetch user details from Firestore
  const fetchUserDetails = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const firstName = userData.firstName || '';
        const lastName = userData.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        // Better fallback logic for display name
        let displayName = fullName;
        if (!displayName && userData.displayName) {
          displayName = userData.displayName;
        }
        if (!displayName && userData.email) {
          displayName = userData.email.split('@')[0];
        }
        if (!displayName) {
          displayName = 'User';
        }
        
        console.log('Fetched user details:', { userId, userData, displayName });
        
        return {
          id: userId,
          name: displayName,
          role: userData.role || 'user',
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email
        };
      }
      
      console.warn('User not found:', userId);
      return { id: userId, name: 'Unknown User', role: 'user' };
    } catch (error) {
      console.error('Error fetching user details:', error);
      return { id: userId, name: 'Unknown User', role: 'user' };
    }
  };

  // Refresh user details for existing chats
  const refreshChatUserDetails = async () => {
    try {
      const updatedChats = await Promise.all(chats.map(async (chat) => {
        const otherUserId = chat.participants?.find(id => id !== currentUser.uid);
        if (!otherUserId) return chat;
        
        const otherUserDetails = await fetchUserDetails(otherUserId);
        
        return {
          ...chat,
          otherUser: {
            id: otherUserId,
            name: otherUserDetails.name,
            role: otherUserDetails.role
          }
        };
      }));
      
      setChats(updatedChats);
      
      // Update active chat if it exists
      if (activeChat) {
        const updatedActiveChat = updatedChats.find(chat => chat.id === activeChat.id);
        if (updatedActiveChat) {
          setActiveChat(updatedActiveChat);
        }
      }
      
      console.log('Refreshed user details for all chats');
    } catch (error) {
      console.error('Error refreshing chat user details:', error);
    }
  };


  // Helper function to format last seen timestamp
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'never';

    try {
      const lastSeenDate = timestamp.toDate();
      const now = new Date();
      const diffInSeconds = (now - lastSeenDate) / 1000;

      if (diffInSeconds < 60) {
        return `${Math.floor(diffInSeconds)}s ago`;
      } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}m ago`;
      } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
      } else {
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
      }
    } catch (error) {
      console.error('Error formatting last seen:', error);
      return 'never';
    }
  };


     // Handle starting a new chat when navigating from student profile
   useEffect(() => {
     if (location.state?.startChatWith && currentUser) {
       const { id, name, role } = location.state.startChatWith;
       
       console.log('Starting chat with:', { id, name, role, currentUserRole: currentUser.role });
       
       // Check if we already have this chat in our local state
       const existingLocalChat = chats.find(chat => 
         chat.participants.includes(id)
       );
       
       if (existingLocalChat) {
         // Chat exists locally, just select it
         setActiveChat(existingLocalChat);
         fetchMessages(existingLocalChat.id);
       } else {
         // Chat doesn't exist locally, create or find it
         createOrFindChat(id, name, role);
       }
       
       // Clear the state to prevent re-triggering
       navigate('/messaging', { replace: true });
     }
   }, [location.state, currentUser, chats]);

  // Set up real-time listener for messages in active chat
  useEffect(() => {
    if (!activeChat) return;
    
    const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Debug: Log message data to see what's being received
      console.log('Messages received from Firestore:', messagesData);
      
      setMessages(Array.isArray(messagesData) ? messagesData : []);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return () => unsubscribe();
  }, [activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatMessagesRef.current && Array.isArray(messages)) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChatSelect = async (chat) => {
    // Check if this chat is already active
    if (activeChat?.id === chat.id) {
      return; // Already selected
    }
    
    setActiveChat(chat);
    setShowEmojiPicker(false);
    fetchMessages(chat.id);
    
    // Mark messages as read when chat is opened
    if (chat.lastMessageSenderId && chat.lastMessageSenderId !== currentUser.uid) {
      try {
        const chatRef = doc(db, 'chats', chat.id);
        await updateDoc(chatRef, {
          lastMessageRead: true
        });
        console.log('Marked chat as read:', chat.id);
      } catch (error) {
        console.error('Error marking chat as read:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() && activeChat) {
      const messageText = messageInput.trim();
      
      try {
        // Add message to Firestore
        const messageData = {
          text: messageText,
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
          type: 'text'
        };
        
        const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
        await addDoc(messagesRef, messageData);
        
        // Update chat's last message
        const chatRef = doc(db, 'chats', activeChat.id);
        await setDoc(chatRef, {
          lastMessage: messageText,
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: currentUser.uid, // Track who sent the last message
          lastMessageRead: false // Mark as unread for recipient
        }, { merge: true });
        
        // Create notification for the other user
        const otherUserId = activeChat.participants.find(id => id !== currentUser.uid);
        if (otherUserId) {
          try {
            await createMessageNotification(currentUser, otherUserId, messageText);
          } catch (notificationError) {
            console.error('Error creating message notification:', notificationError);
            // Don't fail message sending if notification fails
          }
        }

        // Clear input
        setMessageInput('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
  };

  const handleEmojiClick = (emoji) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (files) => {
    if (files.length > 0 && activeChat) {
      const file = files[0];
      const fileName = file.name;
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
      
      // Check if it's an image file
      const isImage = file.type.startsWith('image/');
      
      try {
        setIsUploading(true);
        
        if (isImage) {
          // For images, convert to base64 first, then save
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const base64Data = e.target.result;
              
              // Check if base64 data is too large (Firestore has 1MB document limit)
              const base64Size = Math.ceil((base64Data.length * 3) / 4);
              const maxSize = 900 * 1024; // 900KB to be safe
              
              if (base64Size > maxSize) {
                alert(`Image is too large (${(base64Size / 1024).toFixed(1)}KB). Please use an image smaller than 900KB.`);
                setIsUploading(false);
                return;
              }
              
              console.log('Image size:', (base64Size / 1024).toFixed(1) + 'KB');
              
              // Create message data with image URL
              const messageData = {
                text: '',
                senderId: currentUser.uid,
                timestamp: serverTimestamp(),
                type: 'image',
                imageUrl: base64Data, // Store the base64 image data
                file: {
                  name: fileName,
                  size: fileSize,
                  icon: 'fa-image'
                }
              };
              
              // Save message to Firestore
              const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
              const messageRef = await addDoc(messagesRef, messageData);
              
              console.log('Message saved with ID:', messageRef.id);
              
              // Update chat's last message with proper sender info
              const currentUserName = (() => {
                const firstName = currentUser.firstName || '';
                const lastName = currentUser.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                return fullName || currentUser.displayName || 'You';
              })();
              
              const chatRef = doc(db, 'chats', activeChat.id);
              await setDoc(chatRef, {
                lastMessage: `${currentUserName} sent a photo`,
                lastMessageTime: serverTimestamp(),
                lastMessageSenderId: currentUser.uid, // Track who sent the last message
                lastMessageRead: false // Mark as unread for recipient
              }, { merge: true });
              
              console.log('Image message saved successfully:', {
                messageId: messageRef.id,
                type: messageData.type,
                hasImageUrl: !!messageData.imageUrl,
                imageUrlLength: messageData.imageUrl?.length || 0
              });

              // Create notification for the other user
              const otherUserId = activeChat.participants.find(id => id !== currentUser.uid);
              if (otherUserId) {
                try {
                  await createMessageNotification(currentUser, otherUserId, `📷 sent a photo`);
                } catch (notificationError) {
                  console.error('Error creating image notification:', notificationError);
                }
              }
            } catch (error) {
              console.error('Error saving image message:', error);
              alert('Failed to save image message. Please try again.');
            } finally {
              setIsUploading(false);
            }
          };
          
          reader.onerror = () => {
            console.error('Error reading image file');
            alert('Failed to read image file. Please try again.');
            setIsUploading(false);
          };
          
          reader.readAsDataURL(file);
        } else {
          // For non-image files, save directly
          const messageData = {
            text: '',
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
            type: 'file',
            file: {
              name: fileName,
              size: fileSize,
              icon: 'fa-file'
            }
          };
          
          // Save message to Firestore
          const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
          await addDoc(messagesRef, messageData);
          
          // Update chat's last message with proper sender info
          const currentUserName = (() => {
            const firstName = currentUser.firstName || '';
            const lastName = currentUser.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            return fullName || currentUser.displayName || 'You';
          })();
          
          const lastMessageText = `${currentUserName} sent a file`;
          console.log('Setting last message for file upload:', {
            chatId: activeChat.id,
            lastMessage: lastMessageText,
            senderId: currentUser.uid,
            currentUserName
          });
          
          const chatRef = doc(db, 'chats', activeChat.id);
          await setDoc(chatRef, {
            lastMessage: lastMessageText,
            lastMessageTime: serverTimestamp(),
            lastMessageSenderId: currentUser.uid, // Track who sent the last message
            lastMessageRead: false // Mark as unread for recipient
          }, { merge: true });
          
          setIsUploading(false);
        }

        setShowFileModal(false);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
        setIsUploading(false);
      }
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleNotificationClick = () => {
    alert('Notifications panel would open here');
  };

  const handleUserProfileClick = () => {
    alert('User profile menu would open here');
  };

  const handleChatAction = (action) => {
    if (action === 'phone') {
      alert('Voice call would start here');
    } else if (action === 'video') {
      alert('Video call would start here');
    } else if (action === 'info') {
      alert('Contact info would be displayed here');
    }
  };

  // Helper function to safely format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Handle both Firestore Timestamps and JavaScript Dates
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else {
        // JavaScript Date or timestamp number
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return '';
      }
      
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error, 'Timestamp:', timestamp);
      return '';
    }
  };

  // Handle image click to show in modal
  const handleImageClick = (imageSrc) => {
    setModalImageSrc(imageSrc);
    setShowImageModal(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageSrc('');
  };

  const handleDownloadFile = (fileName) => {
    alert(`Downloading ${fileName}...`);
  };



  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="loading-chats">
            <p>Loading chats...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Ensure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <>


      {/* Main Content */}
      <div className="dashboard-container">
        <div className="main-content">
          {/* Sidebar */}
          <div className="sidebar">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Messages</h2>
              
              {/* Refresh Button */}
              <button
                onClick={refreshChatUserDetails}
                className="refresh-btn"
                title="Refresh user details"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6c757d',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <i className="fas fa-sync-alt"></i>
              </button>
              
              <div className="search-box">
                 <label htmlFor="searchConversations" className="sr-only">Search conversations</label>
                 <i className="fas fa-search search-icon"></i>
                 <input
                   id="searchConversations"
                   name="searchConversations"
                   type="text"
                   className="search-input"
                   placeholder="Search chats..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   autoComplete="off"
                   aria-label="Search conversations"
                 />
               </div>
            </div>
                         <div className="chat-list" style={{ overflowY: 'auto', maxHeight: '400px' }}>
               {isLoading ? (
                 <div className="loading-chats">
                   <p>Loading chats...</p>
                 </div>
               ) : chats.length === 0 ? (
                 <div className="no-chats">
                   <p>No conversations yet</p>
                   <p>Start chatting with other users!</p>
                 </div>
               ) : (
                                   chats
                    .filter(chat => 
                      chat?.otherUser?.name && 
                      chat.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                                         .map(chat => {
                       // Safe check for otherUser
                       if (!chat?.otherUser?.name) {
                         console.warn('Chat missing otherUser name:', chat);
                         return null; // Skip chats without proper otherUser data
                       }
                       
                       console.log('Rendering chat item:', { chatId: chat.id, otherUser: chat.otherUser, participantDetails: chat.participantDetails });
                       
                       return (
                         <button
                           key={chat.id}
                           id={`chat${chat.id}`}
                           name={`chat${chat.id}`}
                           className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                           onClick={() => handleChatSelect(chat)}
                           aria-label={`Chat with ${chat.otherUser.name}`}
                         >
                           <div className="chat-avatar">
                             {(() => {
                               const userName = chat.otherUser.name || '';
                               return userName.charAt(0).toUpperCase() || 'U';
                             })()}
                           </div>
                                                       <div className="chat-info">
                              <div className="chat-name">
                                {chat.otherUser.name}
                                <span className="chat-time">
                                  {formatTimestamp(chat.lastMessageTime)}
                                </span>
                              </div>
                              <div className="chat-preview">
                                {(() => {
                                  if (!chat.lastMessage) return 'Start a conversation!';
                                  
                                  // Handle old format messages (like "📷 profile.png")
                                  if (chat.lastMessage.startsWith('📷 ')) {
                                    // For old messages without senderId, assume current user sent it
                                    return 'You sent a photo';
                                  }
                                  
                                  if (chat.lastMessage.startsWith('📎 ')) {
                                    // For old messages without senderId, assume current user sent it
                                    return 'You sent a file';
                                  }
                                  
                                  // Handle new format messages with proper sender identification
                                  if (chat.lastMessageSenderId === currentUser.uid) {
                                    // Current user sent the message
                                    if (chat.lastMessage.includes('sent a photo')) {
                                      return 'You sent a photo';
                                    } else if (chat.lastMessage.includes('sent a file')) {
                                      return 'You sent a file';
                                    } else {
                                      return chat.lastMessage;
                                    }
                                  } else {
                                    // Other user sent the message
                                    const otherUserName = chat.otherUser?.name || 'User';
                                    if (chat.lastMessage.includes('sent a photo')) {
                                      return `${otherUserName} sent a photo`;
                                    } else if (chat.lastMessage.includes('sent a file')) {
                                      return `${otherUserName} sent a file`;
                                    } else {
                                      return chat.lastMessage;
                                    }
                                  }
                                })()}
                              </div>
                            </div>
                           <div className="chat-status">
                             <span className={`status-dot ${chat.otherUser?.online === true ? 'online' : 'offline'}`}></span>
                           </div>
                         </button>
                       );
                     })
                    .filter(Boolean) // Remove any null entries
               )}
             </div>
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            <div className="chat-header">
                             <div className="chat-user-info">
                 <div className="chat-user-avatar">
                   {(() => {
                     const otherUserName = activeChat?.otherUser?.name || '';
                     return otherUserName.charAt(0).toUpperCase() || 'U';
                   })()}
                 </div>
                <div className="chat-user-details">
                  <h3>{activeChat?.otherUser?.name || 'Select a chat'}</h3>
                  <div className="chat-user-status">
                    <span className={`status-dot ${activeChat?.otherUser?.online === true ? 'online' : 'offline'}`}></span>
                    <span>
                      {activeChat?.otherUser?.online === true ? 'Online' :
                        activeChat?.otherUser?.lastSeen ? `Last seen ${formatLastSeen(activeChat.otherUser.lastSeen)}` : 'Offline'
                      }
                    </span>
                  </div>
                </div>
              </div>
                             <div className="chat-actions">
                 <button 
                   id="phoneCallBtn"
                   name="phoneCallBtn"
                   className="chat-action"
                   onClick={() => handleChatAction('phone')}
                   aria-label="Start voice call"
                 >
                   <i className="fas fa-phone"></i>
                 </button>
                 <button 
                   id="videoCallBtn"
                   name="videoCallBtn"
                   className="chat-action"
                   onClick={() => handleChatAction('video')}
                   aria-label="Start video call"
                 >
                   <i className="fas fa-video"></i>
                 </button>
                 <button 
                   id="contactInfoBtn"
                   name="contactInfoBtn"
                   className="chat-action"
                   onClick={() => handleChatAction('info')}
                   aria-label="Show contact information"
                 >
                   <i className="fas fa-info-circle"></i>
                 </button>
               </div>
            </div>

                         <div className="chat-messages" ref={chatMessagesRef} style={{ overflowY: 'auto', maxHeight: '400px' }}>
               {!activeChat ? (
                 <div className="no-chat-selected">
                   <p>Select a conversation to start messaging</p>
                 </div>
               ) : (
                 <>
                   <div className="date-divider">
                     <span>Today</span>
                   </div>
                   
                                       {safeMessages.map(message => {
                      console.log('Rendering message:', {
                        id: message.id,
                        type: message.type,
                        senderId: message.senderId,
                        currentUserId: currentUser.uid,
                        isSentByMe: message.senderId === currentUser.uid,
                        text: message.text,
                        hasImage: message.type === 'image',
                        imageUrl: message.imageUrl
                      });
                      
                      return (
                      <div key={message.id} className={`message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`}>
                                                 <div className="message-avatar">
                           {message.senderId === currentUser.uid ? 
                             (() => {
                               const firstName = currentUser.firstName || '';
                               const lastName = currentUser.lastName || '';
                               const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
                               return initials || 'U';
                             })() :
                             (() => {
                               const otherUserName = activeChat?.otherUser?.name || '';
                               return otherUserName.charAt(0).toUpperCase() || 'U';
                             })()
                           }
                         </div>
                                                 <div className="message-content">
                           {message.text && <div className="message-text">{message.text}</div>}
                           
                           {/* Image Message */}
                           {message.type === 'image' && (
                             <div className="message-image">
                               {/* Show sender info for photo messages */}
                               <div className="message-sender-info">
                                 {message.senderId === currentUser.uid ? (
                                   <span className="sender-name">You sent a photo</span>
                                 ) : (
                                   <span className="sender-name">{activeChat?.otherUser?.name || 'User'} sent a photo</span>
                                 )}
                               </div>
                               
                               {message.imageUrl ? (
                                 <img 
                                   src={message.imageUrl} 
                                   alt={message.file?.name || 'Image'} 
                                   className="chat-image"
                                   onClick={() => handleImageClick(message.imageUrl)}
                                   onError={(e) => {
                                     console.error('Image failed to load:', e);
                                     e.target.style.display = 'none';
                                   }}
                                 />
                               ) : (
                                 <div className="image-error">
                                   <p>Image not available</p>
                                   <small>Debug: {JSON.stringify(message)}</small>
                                 </div>
                               )}
                               <div className="image-info">
                                 <div className="image-name">{message.file?.name || 'Image'}</div>
                                 <div className="image-size">{message.file?.size || ''}</div>
                               </div>
                             </div>
                           )}
                           
                           {/* File Message */}
                           {message.type === 'file' && (
                             <div className="message-file">
                               {/* Show sender info for file messages */}
                               <div className="message-sender-info">
                                 {message.senderId === currentUser.uid ? (
                                   <span className="sender-name">You sent a file</span>
                                 ) : (
                                   <span className="sender-name">{activeChat?.otherUser?.name || 'User'} sent a file</span>
                                 )}
                               </div>
                               
                               <div className="file-icon">
                                 <i className="fas fa-file"></i>
                               </div>
                               <div className="file-info">
                                 <div className="file-name">{message.file?.name || 'File'}</div>
                                 <div className="file-size">{message.file?.size || ''}</div>
                               </div>
                               <button 
                                 id={`download${message.id}`}
                                 name={`download${message.id}`}
                                 className="download-btn"
                                 onClick={() => handleDownloadFile(message.file?.name || 'file')}
                                 aria-label={`Download ${message.file?.name || 'file'}`}
                               >
                                 <i className="fas fa-download"></i>
                               </button>
                             </div>
                           )}
                           
                           <div className="message-time">
                             {formatTimestamp(message.timestamp)}
                           </div>
                         </div>
                      </div>
                    );
                   })}
                 </>
               )}
             </div>

            <div className="chat-input">
              <div className="input-container">
                                 <div className="input-tools">
                   <button 
                     id="emojiPickerBtn"
                     name="emojiPickerBtn"
                     className="tool-btn"
                     onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                     aria-label="Open emoji picker"
                   >
                     <i className="far fa-smile"></i>
                   </button>
                   <button 
                     id="fileAttachmentBtn"
                     name="fileAttachmentBtn"
                     className="tool-btn"
                     onClick={() => setShowFileModal(true)}
                     aria-label="Attach file"
                   >
                     <i className="fas fa-paperclip"></i>
                   </button>
                 </div>
                                 <label htmlFor="messageInput" className="sr-only">Type your message</label>
                 <textarea
                   id="messageInput"
                   name="messageInput"
                   className="message-input"
                   placeholder="Type a message..."
                   value={messageInput}
                   onChange={handleInputChange}
                   onKeyDown={handleKeyDown}
                   aria-label="Type your message"
                 />
                                 <button 
                   id="sendMessageBtn"
                   name="sendMessageBtn"
                   className="send-btn"
                   onClick={handleSendMessage}
                   disabled={!messageInput.trim()}
                   aria-label="Send message"
                 >
                   <i className="fas fa-paper-plane"></i>
                 </button>
              </div>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="emoji-picker show">
                                     <div className="emoji-categories">
                     {Object.keys(emojis).map(category => (
                       <button
                         key={category}
                         id={`emojiCategory${category.charAt(0).toUpperCase() + category.slice(1)}`}
                         name={`emojiCategory${category.charAt(0).toUpperCase() + category.slice(1)}`}
                         className={`emoji-category ${activeEmojiCategory === category ? 'active' : ''}`}
                         onClick={() => setActiveEmojiCategory(category)}
                         aria-label={`Select ${category} emoji category`}
                       >
                         {emojis[category][0]}
                       </button>
                     ))}
                   </div>
                                     <div className="emoji-list">
                     {emojis[activeEmojiCategory].map((emoji, index) => (
                       <button
                         key={index}
                         id={`emoji${activeEmojiCategory.charAt(0).toUpperCase() + activeEmojiCategory.slice(1)}${index}`}
                         name={`emoji${activeEmojiCategory.charAt(0).toUpperCase() + activeEmojiCategory.slice(1)}${index}`}
                         className="emoji-item"
                         onClick={() => handleEmojiClick(emoji)}
                         aria-label={`Add ${emoji} emoji to message`}
                       >
                         {emoji}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>

       {/* File Attachment Modal */}
       {showFileModal && (
         <div className="file-modal show">
           <div className="modal-content">
             <div className="modal-header">
               <h3 className="modal-title">Attach File</h3>
               <button 
                 id="closeFileModalBtn"
                 name="closeFileModalBtn"
                 className="close-modal" 
                 onClick={() => setShowFileModal(false)}
                 aria-label="Close file upload modal"
               >
                 <i className="fas fa-times"></i>
               </button>
             </div>
             <div 
               className="file-upload-area"
               onDragOver={handleDragOver}
               onDrop={handleDrop}
             >
               {!selectedFile ? (
                 <>
                   <div className="upload-icon">
                     <i className="fas fa-cloud-upload-alt"></i>
                   </div>
                   <div className="upload-text">Drag and drop files here</div>
                   <div className="upload-subtext">or</div>
                   <button 
                     id="browseFilesBtn"
                     name="browseFilesBtn"
                     className="btn btn-outline"
                     onClick={() => fileInputRef.current?.click()}
                     aria-label="Browse files to upload"
                   >
                     Browse Files
                   </button>
                 </>
               ) : (
                 <div className="file-preview">
                   {isUploading ? (
                     <div className="uploading-indicator">
                       <div className="spinner"></div>
                       <p>Uploading...</p>
                     </div>
                   ) : (
                     <>
                       {filePreview ? (
                         <img src={filePreview} alt="Preview" className="preview-image" />
                       ) : (
                         <div className="file-icon-preview">
                           <i className="fas fa-file"></i>
                         </div>
                       )}
                       <div className="selected-file-info">
                         <div className="selected-file-name">{selectedFile.name}</div>
                         <div className="selected-file-size">
                           {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                         </div>
                       </div>
                     </>
                   )}
                 </div>
               )}
               
               <input
                 ref={fileInputRef}
                 id="fileUpload"
                 name="fileUpload"
                 type="file"
                 className="file-input"
                 accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                 onChange={handleFileInputChange}
                 aria-label="Upload files"
               />
             </div>
             <div className="modal-actions">
               <button 
                 id="cancelUploadBtn"
                 name="cancelUploadBtn"
                 className="btn btn-outline"
                 onClick={() => {
                   setShowFileModal(false);
                   setSelectedFile(null);
                   setFilePreview(null);
                 }}
                 aria-label="Cancel file upload"
               >
                 Cancel
               </button>
               <button 
                 id="sendFileBtn"
                 name="sendFileBtn"
                 className="btn btn-primary"
                 disabled={!selectedFile || isUploading}
                 onClick={() => {
                   if (selectedFile) {
                     handleFileUpload([selectedFile]);
                     setSelectedFile(null);
                     setFilePreview(null);
                   }
                 }}
                 aria-label="Send file"
               >
                 {isUploading ? 'Sending...' : 'Send'}
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Image Modal */}
       {showImageModal && (
         <div className="image-modal-overlay" onClick={closeImageModal}>
           <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
             <button className="image-modal-close" onClick={closeImageModal}>
               <i className="fas fa-times"></i>
             </button>
             <img 
               src={modalImageSrc} 
               alt="Full size" 
               className="image-modal-img"
             />
           </div>
         </div>
       )}
     </>
   );
 }

 export default Messaging;