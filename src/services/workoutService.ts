import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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

const WORKOUTS_COLLECTION = "workouts";

const sanitize = <T extends Record<string, any>>(data: T): T => {
  const result: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      result[key] = value;
    }
  });
  return result as T;
};

const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  if (value?.toDate) return value.toDate();
  return new Date(value);
};

const mapWorkout = (id: string, data: any): Workout => ({
  id,
  userId: data.userId,
  userName: data.userName,
  userPhoto: data.userPhoto ?? null,
  date: toDate(data.date),
  duration: data.duration,
  notes: data.notes || "",
  feeling: data.feeling ?? 5,
  photoURL: data.photoURL ?? null,
  photoPath: data.photoPath ?? null,
  type: data.type,
  exercises: data.exercises ?? null,
  distance: data.distance ?? null,
  likes: data.likes || [],
  comments: (data.comments || []).map((comment: Comment) => ({
    ...comment,
    userPhoto: comment.userPhoto ?? null,
    createdAt: toDate(comment.createdAt),
  })),
  createdAt: toDate(data.createdAt),
});

class WorkoutService {
  async addWorkout(
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    data: {
      date: Date;
      duration: number;
      notes: string;
      feeling: number;
      photoURI?: string | null;
      type: "musculation" | "running" | "other";
      exercises?: Exercise[];
      distance?: number;
    }
  ): Promise<string> {
    const workout: Omit<Workout, "id"> = {
      userId,
      userName,
      userPhoto: userPhoto ?? null,
      date: data.date,
      duration: data.duration,
      notes: data.notes,
      feeling: data.feeling,
      photoURL: null,
      photoPath: null,
      type: data.type,
      exercises: data.exercises ?? null,
      distance: typeof data.distance === "number" ? data.distance : null,
      likes: [],
      comments: [],
      createdAt: new Date(),
    };

    if (data.photoURI) {
      const { url, path } = await this.uploadPhoto(data.photoURI, userId);
      workout.photoURL = url;
      workout.photoPath = path;
    }

    const docRef = await addDoc(collection(db, WORKOUTS_COLLECTION), workout);
    return docRef.id;
  }

  async getUserWorkouts(userId: string): Promise<Workout[]> {
    const q = query(
      collection(db, WORKOUTS_COLLECTION),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const workouts = snapshot.docs.map((d) => mapWorkout(d.id, d.data()));
    return workouts.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getFeedWorkouts(userId: string, friends: string[]): Promise<Workout[]> {
    const ids = Array.from(new Set([userId, ...(friends || [])])).slice(0, 10);
    if (ids.length === 0) return [];

    const q = query(
      collection(db, WORKOUTS_COLLECTION),
      where("userId", "in", ids)
    );
    const snapshot = await getDocs(q);
    const workouts = snapshot.docs.map((d) => mapWorkout(d.id, d.data()));

    return workouts.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getWorkoutById(workoutId: string): Promise<Workout | null> {
    const snap = await getDoc(doc(db, WORKOUTS_COLLECTION, workoutId));
    if (!snap.exists()) return null;
    return mapWorkout(snap.id, snap.data());
  }

  async updateWorkout(
    workoutId: string,
    data: Partial<Workout>,
    options?: { newPhotoURI?: string | null; removePhoto?: boolean }
  ) {
    const refDoc = doc(db, WORKOUTS_COLLECTION, workoutId);
    const snapshot = await getDoc(refDoc);
    if (!snapshot.exists()) return;

    const updates: Partial<Workout> = { ...data };
    const current = snapshot.data() as Workout;

    if (options?.removePhoto) {
      if (current.photoPath) {
        await this.deletePhoto(current.photoPath);
      }
      updates.photoURL = null;
      updates.photoPath = null;
    }

    if (options?.newPhotoURI) {
      const { url, path } = await this.uploadPhoto(
        options.newPhotoURI,
        current.userId
      );
      updates.photoURL = url;
      updates.photoPath = path;

      if (current.photoPath) {
        await this.deletePhoto(current.photoPath);
      }
    }

    const sanitizedUpdates = sanitize(updates);
    if (Object.keys(sanitizedUpdates).length === 0) {
      return;
    }
    await updateDoc(refDoc, sanitizedUpdates);
  }

  async deleteWorkout(workoutId: string) {
    const refDoc = doc(db, WORKOUTS_COLLECTION, workoutId);
    const snapshot = await getDoc(refDoc);

    if (snapshot.exists()) {
      const workout = snapshot.data() as Workout;
      if (workout.photoPath) {
        await this.deletePhoto(workout.photoPath);
      }
    }

    await deleteDoc(refDoc);
  }

  async toggleLike(workoutId: string, userId: string, userName?: string) {
    const refDoc = doc(db, WORKOUTS_COLLECTION, workoutId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return;

    const data = snap.data() as Workout;
    const liked = (data.likes || []).includes(userId);

    await updateDoc(refDoc, {
      likes: liked ? arrayRemove(userId) : arrayUnion(userId),
    });
  }

  async addComment(
    workoutId: string,
    userId: string,
    userName: string,
    userPhoto: string | undefined,
    text: string
  ) {
    const comment: Comment = {
      id: Date.now().toString(),
      userId,
      userName,
      userPhoto: userPhoto ?? null,
      text,
      createdAt: new Date(),
    };

    await updateDoc(
      doc(db, WORKOUTS_COLLECTION, workoutId),
      sanitize({
        comments: arrayUnion(comment),
      })
    );
  }

  async deleteComment(
    workoutId: string,
    commentId: string,
    requesterId?: string
  ) {
    const refDoc = doc(db, WORKOUTS_COLLECTION, workoutId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return;

    const data = snap.data() as Workout;
    const comments: Comment[] = data.comments || [];
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    // Only allow the comment author or the workout owner to delete
    if (
      requesterId &&
      requesterId !== comment.userId &&
      requesterId !== data.userId
    ) {
      throw new Error("Permission refusée");
    }

    const updated = comments.filter((c) => c.id !== commentId);
    await updateDoc(refDoc, { comments: updated });
  }

  private async uploadPhoto(uri: string, userId: string) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `workouts/${userId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    return { url, path };
  }

  private async deletePhoto(path: string) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn("Impossible de supprimer la photo:", error);
    }
  }
}

export default new WorkoutService();
