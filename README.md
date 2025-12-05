# 🏃‍♂️ FitConnect

FitConnect is a modern fitness and social app built with React Native and Expo. It helps users track workouts, connect with friends, share progress, and stay motivated through reminders and messaging.

## Overview

FitConnect offers the following features:

- **User Authentication**
  - Email/password sign-up and login
  - Google and Apple sign-in (see `README_GOOGLE_APPLE.md` for setup)
- **Profile Management**
  - Edit profile details and sports preferences
  - Track daily steps (pedometer integration)
- **Workout Tracking**
  - Add, edit, and delete workouts (musculation, running, and more)
  - View detailed workout history and statistics
- **Feed**
  - See workouts and activities from friends
  - Like and comment on workouts
- **Reminders & Notifications**
  - Schedule daily workout reminders
  - Receive push notifications for activities and messages
- **Messaging**
  - Real-time chat with friends
  - Conversation list and message history
- **Theming**
  - Light and dark mode support

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- (Optional) [EAS CLI](https://docs.expo.dev/eas/) for custom dev builds

### Steps

1. **Clone the repository**

  ```powershell
  git clone https://github.com/AmnezziaCS/FitConnect.git
  cd FitConnect
  ```

2. **Install dependencies**

  ```powershell
  npm install
  ```

3. **Configuration Firebase**

- Créer un projet Firebase sur <https://console.firebase.google.com>
- Activer Authentication (Email/Password, Google, Apple)
- Créer une base de données Firestore
- Créer un bucket Storage
- Activer Cloud Messaging

4. **Configurer les identifiants Firebase**

Dans `src/config/firebase.ts`, remplacer les valeurs par celles de votre projet:

```typescript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID",
};
```

5. **Configure environment**

- Set up Google and Apple sign-in by following `README_GOOGLE_APPLE.md`.
- Update `app.json` with your credentials and settings.

6. **Start the app**

  ```powershell
  npx expo start
  ```

- Use the Expo Go app on your device, or run on an emulator (`npm run android` or `npm run ios`).

## 📋 Configuration Firestore

### Collections nécessaires

#### Users

```
{
  id: string,
  email: string,
  displayName: string,
  photoURL?: string,
  bio?: string,
  favoriteSport?: string,
  totalSteps: number,
  friends: string[],
  createdAt: timestamp
}
```

#### Workouts

```
{
  id: string,
  userId: string,
  userName: string,
  userPhoto?: string,
  date: timestamp,
  duration: number,
  notes: string,
  feeling: number (1-10),
  photoURL: string,
  type: 'musculation' | 'running' | 'other',
  exercises?: Exercise[],
  distance?: number,
  likes: string[],
  comments: Comment[],
  createdAt: timestamp
}
```

#### Conversations

```
{
  id: string,
  participants: string[],
  lastMessage?: Message,
  updatedAt: timestamp
}
```

#### Messages

```
{
  id: string,
  conversationId: string,
  senderId: string,
  text: string,
  createdAt: timestamp,
  read: boolean
}
```

#### Notifications

```
{
  id: string,
  userId: string,
  type: 'like' | 'comment' | 'message' | 'workout_reminder',
  title: string,
  body: string,
  data?: any,
  read: boolean,
  createdAt: timestamp
}
```

## 🔒 Règles de Sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Workouts
    match /workouts/{workoutId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    
    // Messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Folder Structure

- `src/` — Main source code
  - `components/` — Reusable UI components
  - `screens/` — App screens (Feed, Profile, Workouts, Chat, etc.)
  - `services/` — API and business logic
  - `contexts/` — Theme and global state
  - `hooks/` — Custom React hooks
  - `store/` — State management
  - `theme/` — Colors and typography
  - `types/` — TypeScript types
