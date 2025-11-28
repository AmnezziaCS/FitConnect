import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Avatar, Button, Card, Divider, ListItem, Text } from "@rneui/themed";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import workoutService from "../services/workoutService";
import { useAuthStore } from "../store/authStore";
import { RootStackParamList, Workout } from "../types";
import { useTheme } from "../contexts/ThemeContext";

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutDetail">;

export const WorkoutDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const user = useAuthStore((state) => state.user);
  const { colors } = useTheme();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");

  const loadWorkout = async () => {
    try {
      setLoading(true);
      const data = await workoutService.getWorkoutById(workoutId);
      if (data) {
        setWorkout(data);
        if (user) {
          setIsLiked(data.likes.includes(user.id));
        }
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger l'entraînement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const handleLike = async () => {
    if (!user || !workout) return;
    try {
      setIsLiked((prev) => !prev);
      await workoutService.toggleLike(workout.id, user.id);
      await loadWorkout();
    } catch {
      Alert.alert("Erreur", "Impossible de liker.");
    }
  };

  const handleAddComment = async () => {
    if (!user || !workout || !newComment.trim()) return;
    try {
      await workoutService.addComment(
        workout.id,
        user.id,
        user.displayName,
        user.photoURL,
        newComment
      );
      setNewComment("");
      await loadWorkout();
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter le commentaire.");
    }
  };

  const handleDelete = () => {
    if (!user || !workout || user.id !== workout.userId) return;

    Alert.alert(
      "Supprimer",
      "Tu es sûr de vouloir supprimer cet entraînement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await workoutService.deleteWorkout(workout.id);
              navigation.goBack();
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer l'entraînement.");
            }
          },
        },
      ]
    );
  };

  const getFeelingEmoji = (feeling: number) => {
    if (feeling <= 3) return "😫";
    if (feeling <= 5) return "😐";
    if (feeling <= 7) return "🙂";
    if (feeling <= 9) return "😊";
    return "🔥";
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "musculation":
        return "💪 Musculation";
      case "running":
        return "🏃 Course à pied";
      default:
        return "🏋️ Autre";
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Chargement...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text h4 style={{ color: colors.text }}>
          Entraînement introuvable
        </Text>
        <Button title="Retour" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.userHeader}>
          <Avatar
            size={50}
            rounded
            source={{
              uri: workout.userPhoto || "https://via.placeholder.com/50",
            }}
          />
          <View style={styles.userInfo}>
            <Text h4>{workout.userName}</Text>
            <Text style={styles.dateText}>
              {format(new Date(workout.date), "dd MMMM yyyy", { locale: fr })}
            </Text>
          </View>
          {user?.id === workout.userId && (
            <View style={styles.ownerActions}>
              <Button
                type="outline"
                title="Modifier"
                onPress={() =>
                  navigation.navigate("EditWorkout", { workoutId: workout.id })
                }
                buttonStyle={{ borderColor: colors.primary }}
                titleStyle={{ color: colors.primary }}
              />
            </View>
          )}
        </View>
        {workout.photoURL && (
          <Image source={{ uri: workout.photoURL }} style={styles.coverPhoto} />
        )}
      </Card>

      <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Card.Title>Informations</Card.Title>
        <Divider />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type :</Text>
          <Text style={styles.infoValue}>{getTypeLabel(workout.type)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Durée :</Text>
          <Text style={styles.infoValue}>{workout.duration} minutes</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ressenti :</Text>
          <Text style={styles.infoValue}>
            {getFeelingEmoji(workout.feeling)} {workout.feeling}/10
          </Text>
        </View>

        {workout.notes && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes :</Text>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          </>
        )}
      </Card>

      {workout.type === "running" && workout.distance && (
        <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Card.Title>Distance parcourue</Card.Title>
          <Divider />
          <View style={styles.distanceContainer}>
            <Text h2 style={styles.distanceValue}>
              {workout.distance} km
            </Text>
          </View>
        </Card>
      )}

      {workout.type === "musculation" &&
        workout.exercises &&
        workout.exercises.length > 0 && (
          <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Card.Title>Exercices</Card.Title>
            <Divider />
            {workout.exercises.map((exercise, index) => (
              <ListItem key={index} bottomDivider>
                <ListItem.Content>
                  <ListItem.Title>{exercise.name}</ListItem.Title>
                  <ListItem.Subtitle>
                    {exercise.sets} séries × {exercise.reps} répétitions
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
            ))}
          </Card>
        )}

      <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.actionsRow}>
          <Button
            type={isLiked ? "solid" : "outline"}
            icon={{
              name: "heart",
              type: "font-awesome",
              size: 18,
              color: isLiked ? "white" : "#FF6B6B",
            }}
            title={`${workout.likes.length} J'aime`}
            onPress={handleLike}
            buttonStyle={[
              styles.actionButton,
              isLiked && { backgroundColor: "#FF6B6B" },
            ]}
          />
          <Button
            type="outline"
            icon={{
              name: "comment",
              type: "font-awesome",
              size: 18,
              color: "#2196F3",
            }}
            title={`${workout.comments.length} Commentaires`}
            buttonStyle={styles.actionButton}
          />
        </View>
      </Card>

      <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Card.Title>Commentaires ({workout.comments.length})</Card.Title>
        <Divider />
        <View style={styles.addCommentContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor="#999"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <Button
            icon={{
              name: "send",
              type: "font-awesome",
              size: 16,
              color: "white",
            }}
            onPress={handleAddComment}
            disabled={!newComment.trim()}
            buttonStyle={styles.sendButton}
          />
        </View>
        <Divider style={styles.divider} />
        {workout.comments.length === 0 ? (
          <Text style={styles.noCommentsText}>
            Aucun commentaire pour le moment
          </Text>
        ) : (
          [...workout.comments]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((comment) => (
              <ListItem key={comment.id} bottomDivider>
                <Avatar
                  size={40}
                  rounded
                  source={{
                    uri: comment.userPhoto || "https://via.placeholder.com/40",
                  }}
                />
                <ListItem.Content>
                  <ListItem.Title style={styles.commentUserName}>
                    {comment.userName}
                  </ListItem.Title>
                  <ListItem.Subtitle style={styles.commentText}>
                    {comment.text}
                  </ListItem.Subtitle>
                  <Text style={styles.commentDate}>
                    {format(new Date(comment.createdAt), "dd MMM yyyy", {
                      locale: fr,
                    })}
                  </Text>
                </ListItem.Content>
              </ListItem>
            ))
        )}
      </Card>

      {user && workout.userId === user.id && (
        <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Button
            title="Supprimer l'entraînement"
            onPress={handleDelete}
            icon={{
              name: "trash",
              type: "font-awesome",
              size: 18,
              color: "white",
            }}
            buttonStyle={styles.deleteButton}
          />
        </Card>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
  },
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dateText: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
  },
  divider: {
    marginVertical: 12,
  },
  notesSection: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  distanceContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  distanceValue: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#FFF",
    minHeight: 40,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  noCommentsText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 20,
    fontSize: 15,
  },
  commentUserName: {
    fontWeight: "600",
    fontSize: 15,
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
  },
  bottomSpacing: {
    height: 40,
  },
});
