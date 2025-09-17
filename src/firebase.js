import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxH1mqZlap7xb2w74Ma4O2pbwgyNUMzdE",
  authDomain: "cconnect-7f562.firebaseapp.com",
  projectId: "cconnect-7f562",
  storageBucket: "cconnect-7f562.appspot.com",
  messagingSenderId: "628107878370",
  appId: "1:628107878370:web:85e027be6291d83a1fa3bb",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;