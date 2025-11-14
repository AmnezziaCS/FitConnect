import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useTheme } from "../contexts/ThemeContext";
import workoutService from "../services/workoutService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";
import { Exercise } from "../types";

export const AddWorkoutScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);

  const [date, setDate] = useState(new Date());
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [feeling, setFeeling] = useState(5);
  const [type, setType] = useState<"musculation" | "running" | "other">(
    "other"
  );
  const [photo, setPhoto] = useState<string | null>(null);

  // For musculation
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");

  // For running
  const [distance, setDistance] = useState("");

  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted" || cameraStatus !== "granted") {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès à la caméra et à la galerie"
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const addExercise = () => {
    if (!exerciseName || !sets || !reps) {
      Alert.alert("Erreur", "Remplissez tous les champs de l'exercice");
      return;
    }

    const exercise: Exercise = {
      name: exerciseName,
      sets: parseInt(sets),
      reps: parseInt(reps),
    };

    setExercises([...exercises, exercise]);
    setExerciseName("");
    setSets("");
    setReps("");
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!duration || !photo) {
      Alert.alert(
        "Erreur",
        "Veuillez remplir les champs obligatoires et ajouter une photo"
      );
      return;
    }

    if (type === "musculation" && exercises.length === 0) {
      Alert.alert("Erreur", "Ajoutez au moins un exercice pour la musculation");
      return;
    }

    if (type === "running" && !distance) {
      Alert.alert("Erreur", "Indiquez la distance parcourue");
      return;
    }

    setLoading(true);
    try {
      await workoutService.createWorkout(
        user.id,
        user.displayName,
        user.photoURL,
        {
          date,
          duration: parseInt(duration),
          notes,
          feeling,
          photoURI: photo,
          type,
          exercises: type === "musculation" ? exercises : undefined,
          distance: type === "running" ? parseFloat(distance) : undefined,
        }
      );

      Alert.alert("Succès", "Entraînement ajouté !", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }, typography.h2]}>
          Nouvel entraînement
        </Text>

        {/* Photo */}
        <View style={styles.photoSection}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View
              style={[
                styles.photoPlaceholder,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text
                style={[
                  styles.photoPlaceholderText,
                  { color: colors.textTertiary },
                ]}
              >
                📷
              </Text>
            </View>
          )}
          <View style={styles.photoButtons}>
            <Button
              title="Galerie"
              onPress={pickImage}
              variant="outline"
              size="small"
            />
            <Button
              title="Caméra"
              onPress={takePhoto}
              variant="outline"
              size="small"
            />
          </View>
        </View>

        {/* Type */}
        <Text
          style={[styles.label, { color: colors.text }, typography.bodyMedium]}
        >
          Type d&apos;entraînement
        </Text>
        <View style={styles.typeButtons}>
          {(["musculation", "running", "other"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[
                styles.typeButton,
                {
                  backgroundColor: type === t ? colors.primary : colors.surface,
                  borderColor: type === t ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: type === t ? "#FFFFFF" : colors.text },
                  typography.small,
                ]}
              >
                {t === "musculation"
                  ? "💪 Muscu"
                  : t === "running"
                  ? "🏃 Course"
                  : "🏋️ Autre"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <Input
          label="Durée (minutes) *"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          placeholder="45"
        />

        {/* Distance for running */}
        {type === "running" && (
          <Input
            label="Distance (km) *"
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
            placeholder="5.2"
          />
        )}

        {/* Exercises for musculation */}
        {type === "musculation" && (
          <View style={styles.exercisesSection}>
            <Text
              style={[
                styles.label,
                { color: colors.text },
                typography.bodyMedium,
              ]}
            >
              Exercices
            </Text>

            {exercises.map((ex, index) => (
              <View
                key={index}
                style={[
                  styles.exerciseItem,
                  { backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.exerciseInfo}>
                  <Text
                    style={[
                      styles.exerciseText,
                      { color: colors.text },
                      typography.small,
                    ]}
                  >
                    {ex.name}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseDetails,
                      { color: colors.textSecondary },
                      typography.caption,
                    ]}
                  >
                    {ex.sets} séries × {ex.reps} reps
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeExercise(index)}>
                  <Text style={styles.removeButton}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addExerciseForm}>
              <Input
                label="Nom de l'exercice"
                value={exerciseName}
                onChangeText={setExerciseName}
                placeholder="Développé couché"
              />
              <View style={styles.row}>
                <Input
                  label="Séries"
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="numeric"
                  placeholder="3"
                  containerStyle={styles.halfInput}
                />
                <Input
                  label="Répétitions"
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                  placeholder="12"
                  containerStyle={styles.halfInput}
                />
              </View>
              <Button
                title="+ Ajouter exercice"
                onPress={addExercise}
                variant="ghost"
              />
            </View>
          </View>
        )}

        {/* Notes */}
        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Comment s'est passé l'entraînement ?"
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: "top" }}
        />

        {/* Feeling */}
        <Text
          style={[styles.label, { color: colors.text }, typography.bodyMedium]}
        >
          Ressenti: {feeling}/10
        </Text>
        <View style={styles.feelingSlider}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => setFeeling(num)}
              style={[
                styles.feelingButton,
                {
                  backgroundColor:
                    feeling === num ? colors.primary : colors.surface,
                  borderColor: feeling === num ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.feelingText,
                  { color: feeling === num ? "#FFFFFF" : colors.text },
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Enregistrer"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 24,
  },
  photoSection: {
    marginBottom: 24,
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  photoPlaceholderText: {
    fontSize: 48,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  typeButtonText: {},
  exercisesSection: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseText: {},
  exerciseDetails: {},
  removeButton: {
    fontSize: 20,
    color: "#EF4444",
  },
  addExerciseForm: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  feelingSlider: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  feelingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  feelingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 40,
  },
});
