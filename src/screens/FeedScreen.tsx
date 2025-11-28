import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Text } from "@rneui/themed";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { WorkoutCard } from "../components/WorkoutCard";
import workoutService from "../services/workoutService";
import { useAuthStore } from "../store/authStore";
import { RootStackParamList, Workout } from "../types";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../contexts/ThemeContext";

export const FeedScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const load = async () => {
    if (!user) return;
    try {
      const data = await workoutService.getFeedWorkouts(
        user.id,
        user.friends || []
      );
      setWorkouts(data);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de charger le feed");
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={workouts}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <WorkoutCard workout={item} onUpdate={load} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} />
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Aucun entraînement trouvé.
          </Text>
        }
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      />
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, shadowColor: colors.shadow },
        ]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("AddWorkout")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { textAlign: "center", marginTop: 40, color: "#777" },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    backgroundColor: "#FF6B6B",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
