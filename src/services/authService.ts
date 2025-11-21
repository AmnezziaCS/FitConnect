// import appleAuth from "@invertase/react-native-apple-authentication";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User } from "../types";

// Configure Google Sign-In
// GoogleSignin.configure({
//   webClientId: "YOUR_WEB_CLIENT_ID",
// });

class AuthService {
  // Email/Password Sign Up
  async signUpWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<FirebaseUser> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    // Create user document in Firestore
    const userData: User = {
      id: user.uid,
      email: user.email!,
      displayName,
      totalSteps: 0,
      createdAt: new Date(),
      friends: [],
    };

    await setDoc(doc(db, "users", user.uid), userData);

    return user;
  }

  // Email/Password Sign In
  async signInWithEmail(
    email: string,
    password: string
  ): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  }

  // Google Sign In
  // async signInWithGoogle(): Promise<FirebaseUser> {
  //   await GoogleSignin.hasPlayServices();
  //   const { idToken } = await GoogleSignin.signIn();
  //   const googleCredential = GoogleAuthProvider.credential(idToken);
  //   const userCredential = await signInWithCredential(auth, googleCredential);
  //   const user = userCredential.user;

  //   // Check if user document exists, if not create it
  //   const userDoc = await getDoc(doc(db, "users", user.uid));
  //   if (!userDoc.exists()) {
  //     const userData: User = {
  //       id: user.uid,
  //       email: user.email!,
  //       displayName: user.displayName || "User",
  //       photoURL: user.photoURL || undefined,
  //       totalSteps: 0,
  //       createdAt: new Date(),
  //       friends: [],
  //     };
  //     await setDoc(doc(db, "users", user.uid), userData);
  //   }

  //   return user;
  // }

  // Apple Sign In
  // async signInWithApple(): Promise<FirebaseUser> {
  //   const appleAuthRequestResponse = await appleAuth.performRequest({
  //     requestedOperation: appleAuth.Operation.LOGIN,
  //     requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  //   });

  //   const { identityToken, nonce } = appleAuthRequestResponse;
  //   const appleCredential = new OAuthProvider("apple.com").credential({
  //     idToken: identityToken!,
  //     rawNonce: nonce,
  //   });

  //   const userCredential = await signInWithCredential(auth, appleCredential);
  //   const user = userCredential.user;

  //   // Check if user document exists, if not create it
  //   const userDoc = await getDoc(doc(db, "users", user.uid));
  //   if (!userDoc.exists()) {
  //     const userData: User = {
  //       id: user.uid,
  //       email: user.email!,
  //       displayName: user.displayName || "User",
  //       photoURL: user.photoURL || undefined,
  //       totalSteps: 0,
  //       createdAt: new Date(),
  //       friends: [],
  //     };
  //     await setDoc(doc(db, "users", user.uid), userData);
  //   }

  //   return user;
  // }

  // Sign Out
  async signOut(): Promise<void> {
    await signOut(auth);
  }

  // Delete Account
  async deleteAccount(userId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    // Delete user document and all associated data
    await deleteDoc(doc(db, "users", userId));
    // TODO: Delete all user workouts, comments, messages, etc.

    await deleteUser(user);
  }

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}

export default new AuthService();
