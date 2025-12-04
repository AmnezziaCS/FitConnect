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

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  text: string;
  createdAt: Date;
}

export interface Workout {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  date: Date;
  duration: number;
  notes: string;
  feeling: number;
  photoURL?: string | null;
  photoPath?: string | null;
  type: "musculation" | "running" | "other";
  exercises?: Exercise[] | null;
  distance?: number | null;
  likes: string[];
  comments: Comment[];
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
  Notifications: undefined;
  WorkoutDetail: { workoutId: string };
  EditWorkout: { workoutId: string };
  MyWorkouts: undefined;
  EditProfile: undefined;
  Chat: {
    conversationId: string;
    otherUserId: string;
    otherUserName: string;
  };
  Conversations: undefined;
  Notifications: undefined;
};

export type ChatScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Chat"
>;
export type LoginScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Login"
>;
