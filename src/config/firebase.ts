import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBgKNWBKByBCNBI22U5p6t5TDp118lb1Ss",
  authDomain: "test-4a7a1.firebaseapp.com",
  projectId: "test-4a7a1",
  storageBucket: "test-4a7a1.firebasestorage.app",
  messagingSenderId: "1057908938544",
  appId: "1:1057908938544:web:ec5de7875e40ce2b7fdaf5",
  measurementId: "G-JHQ60PY6DS",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export default app;
