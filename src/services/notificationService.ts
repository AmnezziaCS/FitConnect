import * as Notifications from "expo-notifications";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where
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

  // Save Expo push token to user's Firestore document
  async saveExpoPushTokenToUser(userId: string): Promise<void> {
    try {
      // Ensure we have permissions and a token
      await this.requestPermissions();
      if (!this.expoPushToken) return;

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { expoPushToken: this.expoPushToken });
    } catch (e) {
      // ignore errors
      console.warn("Could not save Expo push token:", e);
    }
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
    try {
      // Retrieve the user's Expo push token from Firestore
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const token = userSnap.exists() ? (userSnap.data() as any).expoPushToken : null;

      if (!token) {
        // Fall back to local notification if no remote token available
        await Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: null,
        });
        return;
      }

      // Send push via Expo Push API
      const message = {
        to: token,
        sound: "default",
        title,
        body,
        data: {},
      };

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });
    } catch (e) {
      console.warn("Failed to send push notification:", e);
      // Fallback: show local notification
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: null,
        });
      } catch (err) {
        // ignore
      }
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string): Promise<NotificationType[]> {
    try {
      const q = query(collection(db, "notifications"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as NotificationType));

      // Sort client-side by createdAt (robust to Firestore Timestamp or Date)
      const getTime = (n: NotificationType) => {
        const v: any = n.createdAt;
        if (!v) return 0;
        if (typeof v === "number") return v;
        if (v instanceof Date) return v.getTime();
        if (v.toDate && typeof v.toDate === "function") return v.toDate().getTime();
        if (v.seconds) return v.seconds * 1000; // Firestore Timestamp-like
        return 0;
      };

      return results.sort((a, b) => getTime(b) - getTime(a));
    } catch (e: any) {
      console.warn("getUserNotifications failed:", e?.message || e);
      return [];
    }
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
