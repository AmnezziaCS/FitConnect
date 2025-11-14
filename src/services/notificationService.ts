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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  // Request permissions and get Expo Push Token
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

    // Get Expo Push Token
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;
      console.log("Expo Push Token:", token);
    } catch (error) {
      console.error("Error getting push token:", error);
    }

    return true;
  }

  // Get the current push token
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Schedule workout reminder
  async scheduleWorkoutReminder(time: Date): Promise<string> {
    const trigger: Notifications.NotificationTriggerInput = {
      hour: time.getHours(),
      minute: time.getMinutes(),
      repeats: true,
      type: "date",
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

  // Send like notification (stored in Firestore)
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

    // You can also send a push notification here using Expo's push service
    await this.sendPushNotification(
      userId,
      notification.title,
      notification.body
    );
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
    await this.sendPushNotification(
      userId,
      notification.title,
      notification.body
    );
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
    await this.sendPushNotification(
      userId,
      notification.title,
      notification.body
    );
  }

  // Send push notification using Expo's push service
  private async sendPushNotification(
    userId: string,
    title: string,
    body: string
  ): Promise<void> {
    // In a real app, you would:
    // 1. Store user's Expo Push Token in Firestore when they log in
    // 2. Retrieve the token here
    // 3. Send to Expo's push notification service
    // For now, we'll just send a local notification

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null, // immediate
    });
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

  // Setup notification listeners
  setupNotificationListeners() {
    // Listen for notifications received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Listen for user tapping on notification
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);
      // Handle navigation based on notification data
    });
  }
}

export default new NotificationService();
