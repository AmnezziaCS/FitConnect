import { NativeStackScreenProps } from "@react-navigation/native-stack";

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  favoriteSport?: string;
  totalSteps: number;
  createdAt: Date;
  friends: string[];
}

export interface Workout {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  date: Date;
  duration: number; // in minutes
  notes: string;
  feeling: number; // 1-10
  photoURL: string;
  type: "musculation" | "running" | "other";
  // For musculation
  exercises?: Exercise[];
  // For running
  distance?: number; // in km
  likes: string[]; // user IDs who liked
  comments: Comment[];
  createdAt: Date;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Date;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: "like" | "comment" | "message" | "workout_reminder";
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export type SportType =
  | "boxe"
  | "running"
  | "musculation"
  | "yoga"
  | "swimming"
  | "cycling"
  | "other";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  AddWorkout: undefined;
  Chat: {
    conversationId: string;
    otherUserId: string;
    otherUserName: string;
  };
  Conversations: undefined;
};

export type ChatScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Chat"
>;
export type LoginScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Login"
>;
