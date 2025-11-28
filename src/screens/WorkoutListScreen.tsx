import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import { Text, Card, Avatar } from "@rneui/themed";
import workoutService from "../services/workoutService";
import { useAuthStore } from "../store/authStore";
import { Workout } from "../types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const WorkoutListScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const data = await workoutService.getUserWorkouts(user.id);
      setWorkouts(data);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les entraînements");
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  return (
    <View style={styles.container}>
      <FlatList
        data={workouts}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Card containerStyle={styles.card}>
            <View style={styles.header}>
              <Avatar rounded source={{ uri: item.userPhoto }} />
              <Text style={styles.date}>
                {format(new Date(item.date), "dd MMMM yyyy", { locale: fr })}
              </Text>
            </View>

            <Text>Type : {item.type}</Text>
            <Text>Durée : {item.duration} min</Text>

            {item.distance && <Text>Distance : {item.distance} km</Text>}
            {item.exercises && (
              <Text>Exercices : {item.exercises.length}</Text>
            )}

            <Text>❤️ {item.likes.length} | 💬 {item.comments.length}</Text>
          </Card>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 10 },
  header: { flexDirection: "row", alignItems: "center" },
  date: { marginLeft: 10, fontSize: 15, color: "#333" },
});
