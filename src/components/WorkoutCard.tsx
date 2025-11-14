import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import workoutService from "../services/workoutService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";
import { Workout } from "../types";
import { Card } from "./ui/Card";

interface WorkoutCardProps {
  workout: Workout;
  onUpdate?: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onUpdate,
}) => {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(
    user ? workout.likes.includes(user.id) : false
  );

  const handleLike = async () => {
    if (!user) return;

    try {
      setIsLiked(!isLiked);
      await workoutService.toggleLike(workout.id, user.id);
      onUpdate?.();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de liker");
      setIsLiked(!isLiked);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      await workoutService.addComment(
        workout.id,
        user.id,
        user.displayName,
        user.photoURL,
        newComment
      );
      setNewComment("");
      onUpdate?.();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de commenter");
    }
  };

  const getFeelingEmoji = (feeling: number) => {
    if (feeling <= 3) return "😫";
    if (feeling <= 5) return "😐";
    if (feeling <= 7) return "🙂";
    if (feeling <= 9) return "😊";
    return "🔥";
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{
            uri: workout.userPhoto || "https://via.placeholder.com/40",
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text
            style={[
              styles.userName,
              { color: colors.text },
              typography.bodyMedium,
            ]}
          >
            {workout.userName}
          </Text>
          <Text
            style={[
              styles.date,
              { color: colors.textTertiary },
              typography.caption,
            ]}
          >
            {format(new Date(workout.date), "dd MMMM yyyy", { locale: fr })}
          </Text>
        </View>
      </View>

      {/* Image */}
      <Image source={{ uri: workout.photoURL }} style={styles.image} />

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text
              style={[
                styles.statLabel,
                { color: colors.textSecondary },
                typography.caption,
              ]}
            >
              Durée
            </Text>
            <Text
              style={[
                styles.statValue,
                { color: colors.text },
                typography.bodySemibold,
              ]}
            >
              {workout.duration} min
            </Text>
          </View>

          {workout.type === "running" && workout.distance && (
            <View style={styles.stat}>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.textSecondary },
                  typography.caption,
                ]}
              >
                Distance
              </Text>
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text },
                  typography.bodySemibold,
                ]}
              >
                {workout.distance} km
              </Text>
            </View>
          )}

          <View style={styles.stat}>
            <Text
              style={[
                styles.statLabel,
                { color: colors.textSecondary },
                typography.caption,
              ]}
            >
              Ressenti
            </Text>
            <Text
              style={[
                styles.statValue,
                { color: colors.text },
                typography.bodySemibold,
              ]}
            >
              {getFeelingEmoji(workout.feeling)} {workout.feeling}/10
            </Text>
          </View>
        </View>

        {workout.notes && (
          <Text style={[styles.notes, { color: colors.text }, typography.body]}>
            {workout.notes}
          </Text>
        )}

        {workout.type === "musculation" &&
          workout.exercises &&
          workout.exercises.length > 0 && (
            <View style={styles.exercises}>
              <Text
                style={[
                  styles.exercisesTitle,
                  { color: colors.text },
                  typography.bodyMedium,
                ]}
              >
                Exercices:
              </Text>
              {workout.exercises.map((ex, index) => (
                <Text
                  key={index}
                  style={[
                    styles.exercise,
                    { color: colors.textSecondary },
                    typography.small,
                  ]}
                >
                  • {ex.name}: {ex.sets} séries × {ex.reps} reps
                </Text>
              ))}
            </View>
          )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Text style={styles.likeIcon}>{isLiked ? "❤️" : "🤍"}</Text>
          <Text
            style={[
              styles.actionText,
              { color: colors.text },
              typography.small,
            ]}
          >
            {workout.likes.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowComments(!showComments)}
          style={styles.actionButton}
        >
          <Text style={styles.commentIcon}>💬</Text>
          <Text
            style={[
              styles.actionText,
              { color: colors.text },
              typography.small,
            ]}
          >
            {workout.comments.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments */}
      {showComments && (
        <View style={styles.commentsSection}>
          {workout.comments.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Image
                source={{
                  uri: comment.userPhoto || "https://via.placeholder.com/30",
                }}
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <Text
                  style={[
                    styles.commentUser,
                    { color: colors.text },
                    typography.smallMedium,
                  ]}
                >
                  {comment.userName}
                </Text>
                <Text
                  style={[
                    styles.commentText,
                    { color: colors.text },
                    typography.small,
                  ]}
                >
                  {comment.text}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.addComment}>
            <TextInput
              style={[
                styles.commentInput,
                { backgroundColor: colors.surface, color: colors.text },
                typography.small,
              ]}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor={colors.textTertiary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddComment}
              style={styles.sendButton}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {},
  date: {},
  image: {
    width: "100%",
    height: 300,
  },
  details: {
    padding: 12,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {},
  statValue: {},
  notes: {
    marginTop: 8,
  },
  exercises: {
    marginTop: 12,
  },
  exercisesTitle: {
    marginBottom: 4,
  },
  exercise: {
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeIcon: {
    fontSize: 20,
  },
  commentIcon: {
    fontSize: 20,
  },
  actionText: {},
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  comment: {
    flexDirection: "row",
    marginBottom: 12,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  commentContent: {
    marginLeft: 8,
    flex: 1,
  },
  commentUser: {
    marginBottom: 2,
  },
  commentText: {},
  addComment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    fontSize: 20,
  },
});
