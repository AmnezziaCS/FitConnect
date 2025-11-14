import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../config/firebase";
import { User } from "../types";

class UserService {
  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  }

  // Update user profile
  async updateProfile(
    userId: string,
    updates: {
      displayName?: string;
      bio?: string;
      favoriteSport?: string;
      photoURI?: string;
    }
  ): Promise<void> {
    const userRef = doc(db, "users", userId);
    const updateData: any = {};

    if (updates.displayName) updateData.displayName = updates.displayName;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.favoriteSport) updateData.favoriteSport = updates.favoriteSport;

    if (updates.photoURI) {
      const photoURL = await this.uploadProfilePhoto(updates.photoURI, userId);
      updateData.photoURL = photoURL;
    }

    await updateDoc(userRef, updateData);
  }

  // Upload profile photo
  private async uploadProfilePhoto(
    uri: string,
    userId: string
  ): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `profiles/${userId}/avatar.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  }

  // Update total steps
  async updateTotalSteps(userId: string, steps: number): Promise<void> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { totalSteps: steps });
  }

  // Search users
  async searchUsers(searchQuery: string): Promise<User[]> {
    const usersRef = collection(db, "users");
    const q = query(usersRef);
    const snapshot = await getDocs(q);

    const users = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as User))
      .filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return users;
  }

  // Add friend
  async addFriend(userId: string, friendId: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    const friendRef = doc(db, "users", friendId);

    await updateDoc(userRef, {
      friends: arrayUnion(friendId),
    });

    await updateDoc(friendRef, {
      friends: arrayUnion(userId),
    });
  }

  // Remove friend
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    const friendRef = doc(db, "users", friendId);

    await updateDoc(userRef, {
      friends: arrayRemove(friendId),
    });

    await updateDoc(friendRef, {
      friends: arrayRemove(userId),
    });
  }

  // Get user's friends
  async getFriends(userId: string): Promise<User[]> {
    const user = await this.getUserById(userId);
    if (!user || !user.friends.length) return [];

    const friendsPromises = user.friends.map((friendId) =>
      this.getUserById(friendId)
    );
    const friends = await Promise.all(friendsPromises);
    return friends.filter((f) => f !== null) as User[];
  }
}

export default new UserService();
