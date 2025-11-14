# FitConnect - Réseau Social Sportif

Application mobile React Native de réseau social sportif permettant aux utilisateurs de suivre leurs entraînements, interagir avec leurs amis et rester motivés.

## 🚀 Fonctionnalités

### ✅ Authentification

- Inscription/Connexion avec email + mot de passe
- Connexion via Google
- Connexion via Apple (iOS)
- Déconnexion
- Suppression de compte avec données associées

### 👤 Profil Utilisateur

- Informations de base (nom, photo, bio)
- Sport favori personnalisable
- Affichage du nombre total de pas (via podomètre natif)
- Modification du profil
- Thème clair/sombre/automatique

### 💪 Gestion des Entraînements

- **CRUD complet:**
  - Ajouter un entraînement avec date, durée, notes, ressenti (1-10)
  - Photo obligatoire (caméra ou galerie)
  - Type d'entraînement: Musculation, Course, Autre
  - **Musculation:** exercices / séries / répétitions
  - **Course:** distance parcourue
  - Modifier un entraînement
  - Supprimer un entraînement
- Fil d'actualité avec entraînements de l'utilisateur et amis
- Historique personnel

### 🤝 Interaction Sociale

- Bouton "like" avec icône dynamique ❤️
- Zone de commentaires avec CRUD complet
- Notifications push:
  - Nouveau like sur un entraînement
  - Nouveau commentaire
  - Rappels d'entraînement personnalisés

### 💬 Messagerie Interne

- Chat 1-1 entre utilisateurs
- Liste des conversations récentes
- Messages en temps réel
- Notifications push pour nouveaux messages

### 📱 APIs Natives

- **Podomètre:** Comptage des pas avec Expo Sensors
- **Caméra/Galerie:** Capture et sélection de photos
- **Notifications locales:** Rappels d'entraînement personnalisables

### 🎨 Design & UX

- Composants UI maison (Button, Input, Card, Modal)
- Système de couleurs centralisé
- Mode clair/sombre
- Typographies personnalisées (Poppins + Inter)
- Animations fluides

## 📦 Structure du Projet

```
fitconnect/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   └── WorkoutCard.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── FeedScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── AddWorkoutScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── ConversationsScreen.tsx
│   ├── services/
│   │   ├── authService.ts
│   │   ├── workoutService.ts
│   │   ├── userService.ts
│   │   ├── messageService.ts
│   │   └── notificationService.ts
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── store/
│   │   └── authStore.ts
│   ├── hooks/
│   │   └── usePedometer.ts
│   ├── theme/
│   │   ├── colors.ts
│   │   └── typography.ts
│   ├── types/
│   │   └── index.ts
│   └── config/
│       └── firebase.ts
├── App.tsx
├── package.json
└── README.md
```

## 🛠️ Installation

### Prérequis

- Node.js >= 16
- npm ou yarn
- Expo CLI
- Compte Firebase

### Étapes

1. **Cloner le projet**

```bash
git clone <repo-url>
cd fitconnect
```

2. **Installer les dépendances**

```bash
npm install
# ou
yarn install
```

3. **Configuration Firebase**

- Créer un projet Firebase sur <https://console.firebase.google.com>
- Activer Authentication (Email/Password, Google, Apple)
- Créer une base de données Firestore
- Créer un bucket Storage
- Activer Cloud Messaging

4. **Configurer les identifiants Firebase

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

5. **Configuration Google Sign-In**
Dans `src/services/authService.ts`:

```typescript
GoogleSignin.configure({
  webClientId: 'VOTRE_WEB_CLIENT_ID',
});
```

6. **Lancer l'application**

```bash
npm start
# ou
expo start
```

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

## 📱 Plateformes Supportées

- ✅ iOS
- ✅ Android
- ⚠️ Web (limité - certaines APIs natives non disponibles)

## 🎨 Personnalisation

### Couleurs

Modifier les couleurs dans `src/theme/colors.ts`

### Typographies

Changer les polices dans `src/theme/typography.ts`

## 🚧 Fonctionnalités à Venir

- [ ] Recherche d'utilisateurs
- [ ] Système d'amis avec demandes
- [ ] Statistiques avancées
- [ ] Objectifs d'entraînement
- [ ] Groupes d'entraînement
- [ ] Partage sur réseaux sociaux

## 🐛 Problèmes Connus

- Le podomètre nécessite les permissions appropriées sur iOS/Android
- Apple Sign-In disponible uniquement sur iOS
- Les notifications push nécessitent une configuration supplémentaire

Développé avec ❤️ pour la communauté sportive
