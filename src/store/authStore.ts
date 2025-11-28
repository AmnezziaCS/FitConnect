import { User as FirebaseUser } from "firebase/auth";
import { create } from "zustand";
import { auth } from "../config/firebase";
import notificationService from "../services/notificationService";
import userService from "../services/userService";
import { User } from "../types";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  loadUserData: () => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  user: null,
  loading: true,

  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),

  setUser: (user) => set({ user }),

  setLoading: (loading) => set({ loading }),

  loadUserData: async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const userData = await userService.getUserById(firebaseUser.uid);
      set({ user: userData, firebaseUser, loading: false });
      // Request and save Expo push token for this user
      try {
        await notificationService.saveExpoPushTokenToUser(firebaseUser.uid);
      } catch (e) {
        // ignore
      }
    } else {
      set({ user: null, firebaseUser: null, loading: false });
    }
  },

  signOut: () => set({ firebaseUser: null, user: null }),
}));
