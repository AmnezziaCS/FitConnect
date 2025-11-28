import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBJl3LYqBOrqo0qqo4sn6_4LLcxY0boBsk",
  authDomain: "fitconnect-ece95.firebaseapp.com",
  projectId: "fitconnect-ece95",
  storageBucket: "fitconnect-ece95.firebasestorage.app",
  messagingSenderId: "802646631140",
  appId: "1:802646631140:web:d24ac4bec6db88e77442f1",
  measurementId: "G-RRYV5QVV58",
};

const app = initializeApp(firebaseConfig);

// Use different persistence based on platform
export const auth =
  Platform.OS === "web"
    ? getAuth(app) // Web uses default browserLocalPersistence
    : initializeAuth(app, {
        // Leave default/native persistence. If you install the
        // `firebase/auth/react-native` helper later, you can enable
        // `getReactNativePersistence(ReactNativeAsyncStorage)` here.
      });

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
