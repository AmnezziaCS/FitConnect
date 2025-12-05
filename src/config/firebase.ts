import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
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
