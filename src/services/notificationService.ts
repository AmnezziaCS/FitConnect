import * as Notifications from "expo-notifications";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../config/firebase";
import { Notification as NotificationType } from "../types";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  // Request permissions
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B35",
      });
    }

    return true;
  }

  // Schedule workout reminder
  async scheduleWorkoutReminder(time: Date): Promise<string> {
    const trigger: Notifications.NotificationTriggerInput = {
      hour: time.getHours(),
      minute: time.getMinutes(),
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "N'oublie pas ta séance ! 💪",
        body: "C'est l'heure de ton entraînement du jour !",
        data: { type: "workout_reminder" },
      },
      trigger,
    });

    return notificationId;
  }

  // Cancel notification
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Send like notification
  async sendLikeNotification(
    userId: string,
    likerName: string,
    workoutId: string
  ): Promise<void> {
    const notification: Omit<NotificationType, "id"> = {
      userId,
      type: "like",
      title: "Nouveau like ❤️",
      body: `${likerName} a aimé ton entraînement`,
      data: { workoutId },
      read: false,
      createdAt: new Date(),
    };

    await addDoc(collection(db, "notifications"), notification);
  }

  // Send comment notification
  async sendCommentNotification(
    userId: string,
    commenterName: string,
    workoutId: string,
    comment: string
  ): Promise<void> {
    const notification: Omit<NotificationType, "id"> = {
      userId,
      type: "comment",
      title: "Nouveau commentaire 💬",
      body: `${commenterName}: ${comment.substring(0, 50)}${
        comment.length > 50 ? "..." : ""
      }`,
      data: { workoutId },
      read: false,
      createdAt: new Date(),
    };

    await addDoc(collection(db, "notifications"), notification);
  }

  // Send message notification
  async sendMessageNotification(
    userId: string,
    senderName: string,
    conversationId: string,
    messagePreview: string
  ): Promise<void> {
    const notification: Omit<NotificationType, "id"> = {
      userId,
      type: "message",
      title: `Message de ${senderName} 📨`,
      body: messagePreview.substring(0, 100),
      data: { conversationId },
      read: false,
      createdAt: new Date(),
    };

    await addDoc(collection(db, "notifications"), notification);
  }

  // Get user notifications
  async getUserNotifications(userId: string): Promise<NotificationType[]> {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as NotificationType)
    );
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getUserNotifications(userId);
    const updatePromises = notifications
      .filter((n) => !n.read)
      .map((n) => this.markAsRead(n.id));

    await Promise.all(updatePromises);
  }
}

export default new NotificationService();
