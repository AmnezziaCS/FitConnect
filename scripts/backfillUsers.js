/**
 * Backfill script: iterate over all Firebase Auth users and create a minimal
 * Firestore `users/{uid}` document if missing.
 *
 * Usage:
 * 1) Install dependencies (globally or in the project):
 *    npm install firebase-admin
 *
 * 2) Provide service account JSON path via env var:
 *    $env:SERVICE_ACCOUNT_PATH = "C:\path\to\serviceAccountKey.json"
 *    node scripts/backfillUsers.js
 *
 * Alternatively set GOOGLE_APPLICATION_CREDENTIALS to the service account path.
 */

const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error("Service account JSON path not set or file not found. Set SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const firestore = admin.firestore();

async function backfill() {
  console.log("Starting backfill of Auth users -> Firestore users collection");
  let nextPageToken = undefined;
  let total = 0;
  try {
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      for (const user of listUsersResult.users) {
        total++;
        const uid = user.uid;
        const docRef = firestore.doc(`users/${uid}`);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          const userData = {
            id: uid,
            email: user.email || null,
            displayName: user.displayName || (user.email ? user.email.split("@")[0] : "User"),
            photoURL: user.photoURL || null,
            totalSteps: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            friends: [],
          };
          await docRef.set(userData);
          console.log(`Created user doc for ${user.email || uid}`);
        } else {
          // Already exists
        }
      }
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`Backfill complete — checked ${total} users`);
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exit(1);
  }
}

backfill().then(() => process.exit(0));
