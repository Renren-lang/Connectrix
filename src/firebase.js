import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxH1mqZlap7xb2w74Ma4O2pbwgyNUMzdE",
  authDomain: "cconnect-7f562.firebaseapp.com",
  projectId: "cconnect-7f562",
  storageBucket: "cconnect-7f562.firebasestorage.app",
  messagingSenderId: "628107878370",
  appId: "1:628107878370:web:85e027be6291d83a1fa3bb",
  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;