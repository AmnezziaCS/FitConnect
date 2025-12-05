import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Notification } from "../types";

interface Props {
  notification: Notification;
  onPress?: (n: Notification) => void;
}

export const NotificationItem: React.FC<Props> = ({
  notification,
  onPress,
}) => {
  const { colors } = useTheme();

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "like":
        return "heart";
      case "comment":
        return "chatbubble";
      case "message":
        return "mail";
      case "workout_reminder":
        return "fitness";
      default:
        return "notifications";
    }
  };

  const time = notification.createdAt
    ? format(new Date(notification.createdAt), "dd MMM à HH:mm", { locale: fr })
    : "";

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress && onPress(notification)}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: !notification.read
              ? `${colors.primary}10`
              : colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[styles.iconWrap, { backgroundColor: `${colors.primary}20` }]}
        >
          <Ionicons
            name={getIcon(notification.type)}
            size={22}
            color={colors.primary}
          />
        </View>

        <View style={styles.textWrap}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              !notification.read && { fontWeight: "700" },
            ]}
          >
            {notification.title || ""}
          </Text>
          <Text
            style={[styles.body, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {notification.body || ""}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {time}
          </Text>
        </View>

        {!notification.read && (
          <View style={[styles.unread, { backgroundColor: colors.primary }]} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    marginBottom: 4,
    fontSize: 15,
  },
  body: {
    marginBottom: 6,
    fontSize: 13,
  },
  time: {
    fontSize: 12,
  },
  unread: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
});
