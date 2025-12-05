import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Simple service to schedule workout reminder notifications
class ReminderService {
  async initialize() {
    // Request notification permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("workouts", {
        name: "Workout Reminders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B35",
      });
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  // Schedule a one-time or daily reminder at a specific time
  async scheduleReminder(
    hour: number,
    minute: number,
    isDaily: boolean = true
  ): Promise<string> {
    const trigger = isDaily
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY as const,
          hour,
          minute,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes
            .TIME_INTERVAL as const,
          seconds: (hour * 60 + minute) * 60,
        };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "C'est le moment pour t'entraîner ! 💪",
        body: "Allez, à toi de jouer !",
        sound: "default",
        badge: 1,
      },
      trigger,
    });

    console.log("Reminder scheduled with ID:", notificationId);
    return notificationId;
  }

  // Cancel a specific reminder
  async cancelReminder(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log("Reminder cancelled:", notificationId);
  }

  // Cancel all reminders
  async cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All reminders cancelled");
  }

  // Get all scheduled notifications
  async getScheduledReminders() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export default new ReminderService();
