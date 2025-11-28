import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQnlm5YoYVHskDmQVgEZqeQRzmjA2JAd4",
  authDomain: "fitconnect-b00ec.firebaseapp.com",
  projectId: "fitconnect-b00ec",
  storageBucket: "fitconnect-b00ec.firebasestorage.app",
  messagingSenderId: "136013037964",
  appId: "1:136013037964:web:58f90e1c7740d681f296a9",
  measurementId: "G-Y0PDM8413Z"
};

const app = initializeApp(firebaseConfig);

// Note: Firebase Auth persistence warning can be ignored
// Auth state will persist automatically in production builds
// For development in Expo Go, state may not persist between app restarts
export const auth = getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
