import { Avatar, Button, Card, Icon, Input, Text } from "@rneui/themed";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useMemo, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import workoutService from "../services/workoutService";
import { useAuthStore } from "../store/authStore";
import { Workout } from "../types";

interface Props {
  workout: Workout;
  onUpdate: () => void;
  onPress?: (workoutId: string) => void;
  showCommentBox?: boolean;
}

export const WorkoutCard: React.FC<Props> = ({
  workout,
  onUpdate,
  onPress,
  showCommentBox = true,
}) => {
  const user = useAuthStore((s) => s.user);
  const [comment, setComment] = useState("");
  const { colors } = useTheme();

  const formattedDate = useMemo(() => {
    try {
      return format(new Date(workout.date), "dd MMMM yyyy", { locale: fr });
    } catch {
      return "";
    }
  }, [workout.date]);

  const toggleLike = async () => {
    if (!user) return;
    await workoutService.toggleLike(workout.id, user.id);
    onUpdate();
  };

  const submitComment = async () => {
    if (!user || !comment.trim()) return;
    await workoutService.addComment(
      workout.id,
      user.id,
      user.displayName,
      user.photoURL,
      comment
    );
    setComment("");
    onUpdate();
  };

  const handleOpen = () => {
    if (onPress) {
      onPress(workout.id);
    }
  };

  const typeLabel = useMemo(() => {
    switch (workout.type) {
      case "musculation":
        return "Musculation";
      case "running":
        return "Course";
      default:
        return "Autre";
    }
  }, [workout.type]);

  const hasLiked = user ? workout.likes.includes(user.id) : false;

  return (
    <Card
      containerStyle={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} onPress={handleOpen}>
        <View style={styles.header}>
          <Avatar
            rounded
            source={{
              uri: workout.userPhoto || "https://via.placeholder.com/60",
            }}
          />

          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={[styles.name, { color: colors.text }]}>
              {workout.userName}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formattedDate}
            </Text>
          </View>
          <View
            style={[
              styles.typeChip,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Text style={[styles.typeChipText, { color: colors.primary }]}>
              {typeLabel}
            </Text>
          </View>
        </View>

        {workout.photoURL && (
          <Image source={{ uri: workout.photoURL }} style={styles.photo} />
        )}

        <Text style={[styles.metric, { color: colors.text }]}>
          ⏱️ {workout.duration} min · {typeLabel}
        </Text>

        {workout.distance && (
          <Text style={[styles.metric, { color: colors.text }]}>
            📏 {workout.distance} km
          </Text>
        )}
        {workout.exercises && (
          <Text style={[styles.metric, { color: colors.text }]}>
            📝 {workout.exercises.length} exercices
          </Text>
        )}

        {workout.notes && (
          <Text style={[styles.notes, { color: colors.textSecondary }]}>
            “{workout.notes}”
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        <Button
          type={hasLiked ? "solid" : "outline"}
          title={`${workout.likes.length} J'aime`}
          onPress={toggleLike}
          buttonStyle={[
            styles.actionButton,
            hasLiked && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
          titleStyle={{ color: hasLiked ? "#fff" : colors.primary }}
          icon={
            <Icon
              name="heart"
              type="feather"
              size={18}
              color={hasLiked ? "#fff" : colors.primary}
              style={{ marginRight: 6 }}
            />
          }
        />
        {onPress && (
          <Button
            type="outline"
            title="Détails"
            onPress={handleOpen}
            buttonStyle={[
              styles.actionButton,
              { borderColor: colors.textSecondary },
            ]}
            titleStyle={{ color: colors.textSecondary }}
          />
        )}
      </View>

      {showCommentBox && (
        <Input
          placeholder="Ajouter un commentaire..."
          value={comment}
          onChangeText={setComment}
          multiline
          rightIcon={{
            name: "send",
            type: "feather",
            onPress: submitComment,
            color: colors.primary,
          }}
          inputStyle={{ color: colors.text }}
          placeholderTextColor={colors.textTertiary}
          inputContainerStyle={{ borderBottomColor: colors.border }}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 0,
  },
  header: { flexDirection: "row", alignItems: "center" },
  name: { fontWeight: "600", fontSize: 16 },
  date: { fontSize: 13 },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  metric: { marginTop: 4, fontWeight: "500" },
  notes: { marginTop: 10, fontStyle: "italic" },
  actions: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
});
