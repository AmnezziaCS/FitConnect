import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "../config/firebase";
import { Comment, Exercise, Workout } from "../types";
import notificationService from "./notificationService";

class WorkoutService {
  // Create workout
  async createWorkout(
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    data: {
      date: Date;
      duration: number;
      notes: string;
      feeling: number;
      photoURI: string;
      type: "musculation" | "running" | "other";
      exercises?: Exercise[];
      distance?: number;
    }
  ): Promise<string> {
    // Upload photo
    const photoURL = await this.uploadPhoto(data.photoURI, userId);

    const workout: Omit<Workout, "id"> = {
      userId,
      userName,
      userPhoto,
      date: data.date,
      duration: data.duration,
      notes: data.notes,
      feeling: data.feeling,
      photoURL,
      type: data.type,
      exercises: data.exercises,
      distance: data.distance,
      likes: [],
      comments: [],
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "workouts"), workout);
    return docRef.id;
  }

  // Upload photo to Firebase Storage
  private async uploadPhoto(uri: string, userId: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `workouts/${userId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  }

  // Update workout
  async updateWorkout(
    workoutId: string,
    updates: Partial<Workout>
  ): Promise<void> {
    const workoutRef = doc(db, "workouts", workoutId);
    await updateDoc(workoutRef, updates);
  }

  // Delete workout
  async deleteWorkout(workoutId: string): Promise<void> {
    const workoutRef = doc(db, "workouts", workoutId);
    const workoutDoc = await getDoc(workoutRef);

    if (workoutDoc.exists()) {
      const workout = workoutDoc.data() as Workout;
      // Delete photo from storage
      if (workout.photoURL) {
        const photoRef = ref(storage, workout.photoURL);
        await deleteObject(photoRef);
      }
    }

    await deleteDoc(workoutRef);
  }

  // Get user workouts
  async getUserWorkouts(userId: string): Promise<Workout[]> {
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Workout)
    );
  }

  // Get feed workouts (user + friends)
  async getFeedWorkouts(
    userId: string,
    friendIds: string[]
  ): Promise<Workout[]> {
    const userIds = [userId, ...friendIds];
    const q = query(
      collection(db, "workouts"),
      where("userId", "in", userIds),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Workout)
    );
  }

  // Toggle like
  async toggleLike(workoutId: string, userId: string, userName?: string): Promise<void> {
    const workoutRef = doc(db, "workouts", workoutId);
    const workoutDoc = await getDoc(workoutRef);

    if (workoutDoc.exists()) {
      const workout = workoutDoc.data() as Workout;
      const hasLiked = workout.likes.includes(userId);

      if (hasLiked) {
        await updateDoc(workoutRef, {
          likes: arrayRemove(userId),
        });
      } else {
        await updateDoc(workoutRef, {
          likes: arrayUnion(userId),
        });
        // Send notification to the workout owner (don't notify if user likes their own workout)
        try {
          if (workout.userId !== userId) {
            await notificationService.sendLikeNotification(
              workout.userId,
              userName || "Quelqu'un",
              workoutId
            );
          }
        } catch (e) {
          // ignore notification errors
        }
      }
    }
  }

  // Add comment
  async addComment(
    workoutId: string,
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    text: string
  ): Promise<void> {
    const comment: Omit<Comment, "id"> = {
      userId,
      userName,
      userPhoto,
      text,
      createdAt: new Date(),
    };

    const workoutRef = doc(db, "workouts", workoutId);
    await updateDoc(workoutRef, {
      comments: arrayUnion({ ...comment, id: Date.now().toString() }),
    });
    // Notify workout owner about the new comment (avoid notifying self)
    try {
      const workoutDoc = await getDoc(workoutRef);
      if (workoutDoc.exists()) {
        const workout = workoutDoc.data() as Workout;
        if (workout.userId !== userId) {
          await notificationService.sendCommentNotification(
            workout.userId,
            userName,
            workoutId,
            text
          );
        }
      }
    } catch (e) {
      // ignore notification errors
    }
  }

  // Delete comment
  async deleteComment(workoutId: string, commentId: string): Promise<void> {
    const workoutRef = doc(db, "workouts", workoutId);
    const workoutDoc = await getDoc(workoutRef);

    if (workoutDoc.exists()) {
      const workout = workoutDoc.data() as Workout;
      const updatedComments = workout.comments.filter(
        (c) => c.id !== commentId
      );
      await updateDoc(workoutRef, { comments: updatedComments });
    }
  }
}

export default new WorkoutService();
