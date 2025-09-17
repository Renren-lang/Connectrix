// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxH1mqZlap7xb2w74Ma4O2pbwgyNUMzdE",
  authDomain: "cconnect-7f562.firebaseapp.com",
  projectId: "cconnect-7f562",
  storageBucket: "cconnect-7f562.appspot.com",
  messagingSenderId: "628107878370",
  appId: "1:628107878370:web:85e027be6291d83a1fa3bb",
  measurementId: "G-VBD31ZVWJY" // replace with actual if needed
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set persistence for Auth
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth persistence set to local (browserLocalPersistence).");
  })
  .catch((error) => {
    console.error("Error setting Firebase Auth persistence:", error);
  });

export default app;
