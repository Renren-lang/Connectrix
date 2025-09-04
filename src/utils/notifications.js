import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Create a new notification
export const createNotification = async (notificationData) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const notification = {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(notificationsRef, notification);
    console.log('Notification created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Notification types and templates
export const NOTIFICATION_TYPES = {
  MENTORSHIP_REQUEST: 'mentorship_request',
  MESSAGE: 'message',
  LIKE: 'like',
  COMMENT: 'comment'
};

export const createMentorshipRequestNotification = async (studentData, mentorId) => {
  return await createNotification({
    type: NOTIFICATION_TYPES.MENTORSHIP_REQUEST,
    recipientId: mentorId,
    senderId: studentData.uid,
    senderName: `${studentData.firstName} ${studentData.lastName}`.trim() || studentData.email,
    title: 'New Mentorship Request',
    message: `${studentData.firstName} ${studentData.lastName}`.trim() || studentData.email + ' has requested your mentorship',
    data: {
      studentId: studentData.uid,
      studentName: `${studentData.firstName} ${studentData.lastName}`.trim(),
      studentCourse: studentData.course,
      studentBatch: studentData.batch
    }
  });
};

export const createMessageNotification = async (senderData, recipientId, messageText) => {
  const shortMessage = messageText.length > 50 
    ? messageText.substring(0, 50) + '...' 
    : messageText;
    
  return await createNotification({
    type: NOTIFICATION_TYPES.MESSAGE,
    recipientId: recipientId,
    senderId: senderData.uid,
    senderName: `${senderData.firstName} ${senderData.lastName}`.trim() || senderData.email,
    title: 'New Message',
    message: `${senderData.firstName} ${senderData.lastName}`.trim() || senderData.email + ': ' + shortMessage,
    data: {
      chatId: null, // Will be set by caller
      messageText: messageText
    }
  });
};

export const createLikeNotification = async (likerData, recipientId, postData) => {
  return await createNotification({
    type: NOTIFICATION_TYPES.LIKE,
    recipientId: recipientId,
    senderId: likerData.uid,
    senderName: `${likerData.firstName} ${likerData.lastName}`.trim() || likerData.email,
    title: 'New Like',
    message: `${likerData.firstName} ${likerData.lastName}`.trim() || likerData.email + ' liked your post',
    data: {
      postId: postData.id,
      postTitle: postData.title || 'your post'
    }
  });
};

export const createCommentNotification = async (commenterData, recipientId, postData, commentText) => {
  const shortComment = commentText.length > 50 
    ? commentText.substring(0, 50) + '...' 
    : commentText;
    
  return await createNotification({
    type: NOTIFICATION_TYPES.COMMENT,
    recipientId: recipientId,
    senderId: commenterData.uid,
    senderName: `${commenterData.firstName} ${commenterData.lastName}`.trim() || commenterData.email,
    title: 'New Comment',
    message: `${commenterData.firstName} ${commenterData.lastName}`.trim() || commenterData.email + ' commented: ' + shortComment,
    data: {
      postId: postData.id,
      postTitle: postData.title || 'your post',
      commentText: commentText
    }
  });
};

// Error handling utility
export const handleFirebaseError = (error) => {
  let userMessage = 'An unexpected error occurred.';
  
  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
        userMessage = 'User account not found.';
        break;
      case 'auth/wrong-password':
        userMessage = 'Incorrect password.';
        break;
      case 'auth/email-already-in-use':
        userMessage = 'Email is already registered.';
        break;
      case 'auth/weak-password':
        userMessage = 'Password is too weak. Please use at least 6 characters.';
        break;
      case 'auth/invalid-email':
        userMessage = 'Invalid email address.';
        break;
      case 'auth/too-many-requests':
        userMessage = 'Too many failed attempts. Please try again later.';
        break;
      case 'permission-denied':
        userMessage = 'You do not have permission to perform this action.';
        break;
      case 'unavailable':
        userMessage = 'Service temporarily unavailable. Please try again.';
        break;
      default:
        userMessage = error.message || 'An error occurred.';
    }
  } else if (error.message) {
    userMessage = error.message;
  }
  
  return userMessage;
};

// Success message utility
export const showSuccessMessage = (message) => {
  // You can integrate this with your preferred notification system
  console.log('Success:', message);
  // Example: toast.success(message) or alert(message)
};

// Error message utility
export const showErrorMessage = (message) => {
  // You can integrate this with your preferred notification system
  console.error('Error:', message);
  // Example: toast.error(message) or alert(message)
};
