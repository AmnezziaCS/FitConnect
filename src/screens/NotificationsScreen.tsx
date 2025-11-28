import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import notificationService from "../services/notificationService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";

export const NotificationsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await notificationService.getUserNotifications(user.id);
      setNotifications(result);
    } catch (e) {
      console.warn(e);
      Alert.alert("Erreur", "Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      Alert.alert("Erreur", "Impossible de marquer comme lu");
    }
  };

  const handleMarkAll = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      Alert.alert("Erreur", "Impossible de marquer toutes les notifications");
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <View style={{ flex: 1 }}>
        <Text style={[{ color: colors.text }, typography.bodySemibold]}> {item.title} </Text>
        <Text style={[{ color: colors.textSecondary }, typography.small]}> {item.body} </Text>
      </View>
      {!item.read && (
        <TouchableOpacity onPress={() => handleMarkRead(item.id)} style={styles.markButton}>
          <Text style={{ color: colors.primary }}>Marquer lu</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }, typography.h3]}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAll} style={{ marginLeft: 12 }}>
          <Text style={{ color: colors.primary }}>Tout marquer lu</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={() => (
          <View style={{ alignItems: "center", marginTop: 32 }}>
            <Text style={{ color: colors.textSecondary }}>Aucune notification</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  title: { flex: 1 },
  item: { flexDirection: "row", padding: 12, borderRadius: 8, marginBottom: 8 },
  markButton: { paddingHorizontal: 8, justifyContent: "center" },
});

export default NotificationsScreen;
