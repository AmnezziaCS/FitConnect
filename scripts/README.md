Backfill Auth users into Firestore

This folder contains a small Node script to create missing `users/{uid}` documents
in Firestore for users that exist in Firebase Authentication (for example if you
created accounts manually in the Firebase Console).

Prerequisites
- A Firebase project with Firestore enabled.
- A service account JSON key (create in Firebase Console -> Project Settings -> Service accounts).
- Node.js installed locally.

Usage
1) Install `firebase-admin` in the project root or globally:

   npm install firebase-admin

2) Set the `SERVICE_ACCOUNT_PATH` environment variable to the path of the
   service account JSON file, or set `GOOGLE_APPLICATION_CREDENTIALS`.

   PowerShell example:

   $env:SERVICE_ACCOUNT_PATH = "C:\path\to\serviceAccountKey.json"
   node scripts/backfillUsers.js

3) The script will iterate through all Auth users and create a minimal
   Firestore document for each missing user: `users/{uid}`.

Deploying the Cloud Function
1) Initialize Firebase Functions in the `functions/` folder if you haven't yet:

   cd functions
   npm install
   firebase init functions

2) Deploy the trigger:

   firebase deploy --only functions:createUserRecord

Notes
- The Cloud Function `createUserRecord` will automatically create a `users` document for
  any newly created Auth user (covering accounts created via the console, SDKs, or OIDC).
- Keep your service account key secure. For production use, deploy the Cloud Function rather
  than running backfill on a developer machine.
