// Test utility to create sample notifications
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const createTestNotification = async (recipientId, type = 'mentorship_request') => {
  try {
    const notificationsRef = collection(db, 'notifications');
    
    const notificationData = {
      recipientId: recipientId,
      type: type,
      title: getNotificationTitle(type),
      message: getNotificationMessage(type),
      read: false,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(notificationsRef, notificationData);
    console.log('Test notification created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating test notification:', error);
    throw error;
  }
};

const getNotificationTitle = (type) => {
  switch (type) {
    case 'mentorship_request':
      return 'New Mentorship Request';
    case 'message':
      return 'New Message';
    case 'like':
      return 'Someone Liked Your Post';
    case 'comment':
      return 'New Comment on Your Post';
    default:
      return 'New Notification';
  }
};

const getNotificationMessage = (type) => {
  switch (type) {
    case 'mentorship_request':
      return 'A student has requested mentorship from you. Click to view details.';
    case 'message':
      return 'You have received a new message. Click to read it.';
    case 'like':
      return 'Someone liked your recent post in the forum.';
    case 'comment':
      return 'Someone commented on your post. Click to see the comment.';
    default:
      return 'You have a new notification. Click to view details.';
  }
};

// Create multiple test notifications
export const createMultipleTestNotifications = async (recipientId) => {
  const types = ['mentorship_request', 'message', 'like', 'comment'];
  const results = [];
  
  for (const type of types) {
    try {
      const id = await createTestNotification(recipientId, type);
      results.push({ type, id, success: true });
    } catch (error) {
      results.push({ type, id: null, success: false, error: error.message });
    }
  }
  
  return results;
};
