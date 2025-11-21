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
import { WorkoutCard } from "../components/WorkoutCard";
import { useTheme } from "../contexts/ThemeContext";
import workoutService from "../services/workoutService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";
import { Workout } from "../types";

export const MyWorkoutsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "musculation" | "running" | "other"
  >("all");

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    if (!user) return;

    try {
      const data = await workoutService.getUserWorkouts(user.id);
      setWorkouts(data);
    } catch (error) {
      console.error("Error loading workouts:", error);
      Alert.alert("Erreur", "Impossible de charger les entraînements");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkouts();
  };

  const handleDelete = async (workoutId: string) => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous vraiment supprimer cet entraînement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await workoutService.deleteWorkout(workoutId);
              loadWorkouts();
              Alert.alert("Succès", "Entraînement supprimé");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer");
            }
          },
        },
      ]
    );
  };

  const filteredWorkouts = workouts.filter((w) =>
    filter === "all" ? true : w.type === filter
  );

  // Calculate stats
  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
  const totalDistance = workouts
    .filter((w) => w.type === "running" && w.distance)
    .reduce((sum, w) => sum + (w.distance || 0), 0);

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
      {/* Stats Header */}
      <View
        style={[
          styles.statsHeader,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.stat}>
          <Text
            style={[styles.statValue, { color: colors.primary }, typography.h3]}
          >
            {totalWorkouts}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: colors.textSecondary },
              typography.caption,
            ]}
          >
            Entraînements
          </Text>
        </View>
        <View style={styles.stat}>
          <Text
            style={[styles.statValue, { color: colors.primary }, typography.h3]}
          >
            {Math.round(totalDuration / 60)}h
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: colors.textSecondary },
              typography.caption,
            ]}
          >
            Temps total
          </Text>
        </View>
        {totalDistance > 0 && (
          <View style={styles.stat}>
            <Text
              style={[
                styles.statValue,
                { color: colors.primary },
                typography.h3,
              ]}
            >
              {totalDistance.toFixed(1)} km
            </Text>
            <Text
              style={[
                styles.statLabel,
                { color: colors.textSecondary },
                typography.caption,
              ]}
            >
              Distance
            </Text>
          </View>
        )}
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        {(["all", "musculation", "running", "other"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === f ? colors.primary : colors.surface,
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#FFFFFF" : colors.text },
                typography.small,
              ]}
            >
              {f === "all"
                ? "Tous"
                : f === "musculation"
                ? "💪 Muscu"
                : f === "running"
                ? "🏃 Course"
                : "🏋️ Autre"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Workouts List */}
      {filteredWorkouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text
            style={[
              styles.emptyText,
              { color: colors.textSecondary },
              typography.body,
            ]}
          >
            {filter === "all"
              ? "Aucun entraînement"
              : `Aucun entraînement de type "${
                  filter === "musculation"
                    ? "Musculation"
                    : filter === "running"
                    ? "Course"
                    : "Autre"
                }"`}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddWorkout")}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.addButtonText, typography.bodyMedium]}>
              + Ajouter un entraînement
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredWorkouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <WorkoutCard workout={item} onUpdate={loadWorkouts} />
              {item.userId === user?.id && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={[
                      styles.deleteButton,
                      { backgroundColor: colors.error },
                    ]}
                  >
                    <Text style={[styles.deleteButtonText, typography.small]}>
                      🗑️ Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {},
  statLabel: {},
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  filterText: {},
  list: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 24,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#FFFFFF",
  },
  actions: {
    paddingHorizontal: 16,
    marginTop: -8,
    marginBottom: 16,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  deleteButtonText: {
    color: "#FFFFFF",
  },
});
