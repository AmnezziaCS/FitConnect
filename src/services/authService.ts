// import appleAuth from "@invertase/react-native-apple-authentication";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import appleAuth from "@invertase/react-native-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User } from "../types";

// Configure Google Sign-In
// GoogleSignin.configure({
//   webClientId: "YOUR_WEB_CLIENT_ID",
// });

class AuthService {
  constructor() {
    // No top-level configuration for GoogleSignin to avoid importing
    // native modules in Expo Go. GoogleSignin will be dynamically imported
    // at runtime when the native flow is used.
  }
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
  async signInWithGoogle(): Promise<FirebaseUser> {
    // If we're running inside Expo Go (or web), native GoogleSignin may not be
    // available/linked. Use an OAuth web flow (expo-auth-session) as a fallback.
    const isExpoGo = Constants.appOwnership === "expo";
    let idToken: string | undefined;

    if (isExpoGo) {
      // Web OIDC flow to get an ID token
      const storedClientId = await AsyncStorage.getItem("GOOGLE_WEB_CLIENT_ID");
      const clientId =
        storedClientId ||
        (Constants.expoConfig && (Constants.expoConfig as any).extra?.GOOGLE_WEB_CLIENT_ID) ||
        (Constants.manifest && (Constants.manifest as any).extra?.GOOGLE_WEB_CLIENT_ID) ||
        process.env.GOOGLE_WEB_CLIENT_ID ||
        "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com";

      if (clientId === "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com") {
        // Helpful runtime hint for debugging in the device logs
        // eslint-disable-next-line no-console
        console.warn(
          "Google Web Client ID not configured. Set expo.extra.GOOGLE_WEB_CLIENT_ID in app.json or provide process.env.GOOGLE_WEB_CLIENT_ID. See README_GOOGLE_APPLE.md."
        );
      }
      // @ts-ignore: dynamic import of optional dependency (expo-auth-session)
      const AuthSession: any = await import("expo-auth-session");

      const makeRedirectUri = AuthSession.makeRedirectUri || AuthSession.default?.makeRedirectUri;
      const startAsync = AuthSession.startAsync || AuthSession.startAsync || AuthSession.default?.startAsync;
      const openAuthSessionAsync = AuthSession.openAuthSessionAsync || AuthSession.default?.openAuthSessionAsync;

      if (!makeRedirectUri) {
        throw new Error("expo-auth-session is not available or too old; install a compatible version.");
      }

      // Build redirect URI using Expo proxy. If you set `extra.EXPO_USERNAME` in app.json
      // the proxy URI will include it; otherwise Expo will pick the default.
      const redirectUri = makeRedirectUri({ useProxy: true } as any);

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `&response_type=id_token&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent("openid profile email")}` +
        `&nonce=${encodeURIComponent(Math.random().toString(36).substring(2))}`;

      let result: any;
      if (typeof startAsync === "function") {
        result = await startAsync({ authUrl });
      } else if (typeof openAuthSessionAsync === "function") {
        result = await openAuthSessionAsync(authUrl, redirectUri);
      } else if (AuthSession.openBrowserAsync) {
        // Best-effort fallback: open the browser and expect a redirect back to the app.
        await AuthSession.openBrowserAsync(authUrl);
        throw new Error(
          "Opened browser for Google sign-in. Complete the flow in the browser and be redirected back to the app. If this does not happen, use a custom dev client or configure deep links."
        );
      } else {
        throw new Error(
          "AuthSession is not available in this environment. Ensure `expo-auth-session` is installed and supported, or use a custom dev client."
        );
      }
      if (result.type !== "success") {
        throw new Error("Google sign-in cancelled or failed");
      }

      // `params.id_token` holds the JWT id token
      // @ts-ignore
      idToken = result.params?.id_token || result.params?.idToken;
      if (!idToken) throw new Error("No id_token returned from Google");
    } else {
      // Native flow (custom dev client or standalone app)
      // Dynamically import the native GoogleSignin to avoid import-time errors
      // when running inside Expo Go.
      // @ts-ignore: dynamic import of optional native dependency
      const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
      // Configure if needed (replace with your web client id)
      try {
        const nativeClientId =
          (Constants.expoConfig && (Constants.expoConfig as any).extra?.GOOGLE_WEB_CLIENT_ID) ||
          process.env.GOOGLE_WEB_CLIENT_ID ||
          "802646631140-jdimn7btf39cnv224746t6qgvv2ctruj.apps.googleusercontent.com";

        GoogleSignin.configure({
          webClientId: nativeClientId,
          offlineAccess: false,
        });
      } catch (e) {
        // ignore
      }
      await GoogleSignin.hasPlayServices();
      const { idToken: nativeId } = await GoogleSignin.signIn();
      idToken = nativeId ?? undefined;
    }

    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, googleCredential);
    const user = userCredential.user;

    // Ensure user document exists
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      const userData: User = {
        id: user.uid,
        email: user.email!,
        displayName: user.displayName || "User",
        photoURL: user.photoURL || undefined,
        totalSteps: 0,
        createdAt: new Date(),
        friends: [],
      };
      await setDoc(doc(db, "users", user.uid), userData);
    }

    return user;
  }

  // Apple Sign In
  async signInWithApple(): Promise<FirebaseUser> {
    // Apple Sign-In requires generating a secure nonce and SHA256 hashing it.
    // For simplicity this implementation assumes the native appleAuth helper
    // returns a nonce. For production, implement proper nonce generation.
    if (!appleAuth.isSupported) {
      throw new Error(
        "AppleAuth is not supported on the device. Currently Apple Authentication works on iOS devices running iOS 13 or later."
      );
    }

    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const { identityToken, nonce } = appleAuthRequestResponse;
    if (!identityToken) throw new Error("Apple Sign-In failed (no identity token)");

    const provider = new OAuthProvider("apple.com");
    const appleCredential = provider.credential({
      idToken: identityToken,
      rawNonce: nonce as string | undefined,
    });

    const userCredential = await signInWithCredential(auth, appleCredential);
    const user = userCredential.user;

    // Ensure user document exists
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      const userData: User = {
        id: user.uid,
        email: user.email!,
        displayName: user.displayName || "User",
        photoURL: user.photoURL || undefined,
        totalSteps: 0,
        createdAt: new Date(),
        friends: [],
      };
      await setDoc(doc(db, "users", user.uid), userData);
    }

    return user;
  }

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
