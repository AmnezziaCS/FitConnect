import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Card } from "../components/ui/Card";
import { useTheme } from "../contexts/ThemeContext";
import notificationService from "../services/notificationService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";
import { Notification as NotificationType } from "../types";

export const NotificationsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const data = await notificationService.getUserNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
      Alert.alert("Erreur", "Impossible de charger les notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: NotificationType) => {
    // Mark as read
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        loadNotifications();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate based on notification type
    if (notification.type === "like" || notification.type === "comment") {
      navigation.navigate("Main", { screen: "Feed" });
    } else if (notification.type === "message") {
      if (notification.data?.conversationId) {
        navigation.navigate("Chat", {
          conversationId: notification.data.conversationId,
        });
      } else {
        navigation.navigate("Main", { screen: "Messages" });
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await notificationService.markAllAsRead(user.id);
      loadNotifications();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de marquer comme lues");
    }
  };

  const getNotificationIcon = (type: NotificationType["type"]) => {
    switch (type) {
      case "like":
        return "❤️";
      case "comment":
        return "💬";
      case "message":
        return "📨";
      case "workout_reminder":
        return "💪";
      default:
        return "🔔";
    }
  };

  const renderNotification = ({ item }: { item: NotificationType }) => {
    const timeAgo = format(new Date(item.createdAt), "dd MMM à HH:mm", {
      locale: fr,
    });

    return (
      <Card onPress={() => handleNotificationPress(item)}>
        <View style={styles.notificationContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                { color: colors.text },
                typography.bodyMedium,
                !item.read && { fontWeight: "bold" },
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.body,
                { color: colors.textSecondary },
                typography.small,
              ]}
              numberOfLines={2}
            >
              {item.body}
            </Text>
            <Text
              style={[
                styles.time,
                { color: colors.textTertiary },
                typography.caption,
              ]}
            >
              {timeAgo}
            </Text>
          </View>
          {!item.read && (
            <View
              style={[styles.unreadBadge, { backgroundColor: colors.primary }]}
            />
          )}
        </View>
      </Card>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <Text
          style={[
            styles.loadingText,
            { color: colors.textSecondary },
            typography.body,
          ]}
        >
          Chargement...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {notifications.length > 0 && unreadCount > 0 && (
        <View
          style={[
            styles.header,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text
            style={[styles.headerText, { color: colors.text }, typography.body]}
          >
            {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue
            {unreadCount > 1 ? "s" : ""}
          </Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text
              style={[
                styles.markAllText,
                { color: colors.primary },
                typography.smallMedium,
              ]}
            >
              Tout marquer comme lu
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text
            style={[
              styles.emptyText,
              { color: colors.textSecondary },
              typography.body,
            ]}
          >
            Aucune notification
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              { color: colors.textTertiary },
              typography.small,
            ]}
          >
            Vous serez notifié des likes, commentaires et messages
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerText: {},
  markAllText: {},
  list: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  body: {
    marginBottom: 4,
  },
  time: {},
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
  },
});
