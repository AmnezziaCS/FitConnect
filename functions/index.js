const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Admin SDK once. In Cloud Functions environment, this will use
// the built-in service account. For local testing set GOOGLE_APPLICATION_CREDENTIALS
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

/**
 * Trigger: create a Firestore `users/{uid}` document whenever a new Auth user is created.
 * This ensures that users added manually in the Firebase Console Auth show up in Firestore.
 */
exports.createUserRecord = functions.auth.user().onCreate(async (user) => {
  try {
    const userRef = firestore.doc(`users/${user.uid}`);
    const snapshot = await userRef.get();
    if (snapshot.exists) {
      console.log(`users/${user.uid} already exists, skipping`);
      return null;
    }

    const userData = {
      id: user.uid,
      email: user.email || null,
      displayName: user.displayName || (user.email ? user.email.split("@")[0] : "User"),
      photoURL: user.photoURL || null,
      totalSteps: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      friends: [],
    };

    await userRef.set(userData);
    console.log(`Created Firestore user for uid=${user.uid}`);
    return null;
  } catch (err) {
    console.error("Error creating Firestore user document:", err);
    return null;
  }
});
