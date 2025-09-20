// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBxH1mqZlap7xb2w74Ma4O2pbwgyNUMzdE",
  authDomain: "cconnect-7f562.firebaseapp.com",
  databaseURL: "https://cconnect-7f562-default-rtdb.firebaseio.com",
  projectId: "cconnect-7f562",
  storageBucket: "cconnect-7f562.firebasestorage.app",
  messagingSenderId: "628107878370",
  appId: "1:628107878370:web:85e027be6291d83a1fa3bb",
  measurementId: "G-VBD31ZVWJY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set persistence for Auth
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth persistence set to local (browserLocalPersistence).");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Firebase config loaded successfully");
  })
  .catch((error) => {
    console.error("Error setting Firebase Auth persistence:", error);
    // Don't throw the error, just log it as persistence is not critical for basic functionality
  });

export default app;
