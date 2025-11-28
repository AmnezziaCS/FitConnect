import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  ButtonGroup,
  Card,
  Icon,
  Input,
  ListItem,
  Slider,
  Text,
} from "@rneui/themed";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import workoutService from "../services/workoutService";
import { Exercise, RootStackParamList, Workout } from "../types";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../contexts/ThemeContext";

type Props = NativeStackScreenProps<RootStackParamList, "EditWorkout">;

const typeOptions: {
  label: string;
  value: "musculation" | "running" | "other";
}[] = [
  { label: "Musculation", value: "musculation" },
  { label: "Course", value: "running" },
  { label: "Autre", value: "other" },
];

export const EditWorkoutScreen: React.FC<Props> = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const user = useAuthStore((state) => state.user);
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [typeIndex, setTypeIndex] = useState(0);
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [feeling, setFeeling] = useState(5);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [photoReplacement, setPhotoReplacement] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentType = useMemo(
    () => typeOptions[typeIndex]?.value ?? "other",
    [typeIndex]
  );

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      const data = await workoutService.getWorkoutById(workoutId);
      if (!data) {
        Alert.alert("Oups", "Entraînement introuvable", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
        return;
      }
      setWorkout(data);
      setDate(new Date(data.date));
      setDuration(data.duration.toString());
      setNotes(data.notes || "");
      setFeeling(data.feeling);
      const index = typeOptions.findIndex((opt) => opt.value === data.type);
      setTypeIndex(index >= 0 ? index : 0);
      setExercises(data.exercises || []);
      setDistance(data.distance ? data.distance.toString() : "");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger cet entraînement.");
    } finally {
      setLoading(false);
    }
  };

  const askPermission = async (status: ImagePicker.PermissionStatus) => {
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert("Autorisation requise", "Active l'accès caméra/galerie pour changer la photo.");
      return false;
    }
    return true;
  };

  const changePhotoFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (!(await askPermission(status))) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPhotoReplacement(result.assets[0].uri);
      setRemovePhoto(false);
    }
  };

  const changePhotoFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!(await askPermission(status))) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoReplacement(result.assets[0].uri);
      setRemovePhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoReplacement(null);
    setRemovePhoto(true);
  };

  const handleResetPhoto = () => {
    setPhotoReplacement(null);
    setRemovePhoto(false);
  };

  const addExercise = () => {
    if (!exerciseName || !sets || !reps) {
      return Alert.alert("Champs manquants", "Complète l'exercice avant de l'ajouter.");
    }
    setExercises((prev) => [
      ...prev,
      { name: exerciseName, sets: Number(sets), reps: Number(reps) },
    ]);
    setExerciseName("");
    setSets("");
    setReps("");
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!user) {
      Alert.alert("Connexion requise", "Reconnecte-toi pour modifier ton entraînement.");
      return false;
    }

    if (!duration) {
      Alert.alert("Durée", "Indique la durée de la séance.");
      return false;
    }

    if (currentType === "musculation" && exercises.length === 0) {
      Alert.alert("Musculation", "Ajoute au moins un exercice.");
      return false;
    }

    if (currentType === "running" && (!distance || Number(distance) <= 0)) {
      Alert.alert("Course", "Indique la distance parcourue.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      await workoutService.updateWorkout(
        workoutId,
        {
          date,
          duration: Number(duration),
          notes,
          feeling,
          type: currentType,
          exercises: currentType === "musculation" ? exercises : null,
          distance: currentType === "running" ? Number(distance) : null,
        },
        {
          newPhotoURI: photoReplacement || undefined,
          removePhoto: removePhoto && !photoReplacement,
        }
      );
      Alert.alert("Mis à jour", "Ton entraînement a été modifié.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", error?.message || "Impossible de sauvegarder les modifications.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!workout) {
    return null;
  }

  const photoPreview = photoReplacement || (removePhoto ? null : workout.photoURL);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text h3 style={[styles.title, { color: colors.text }]}>
        Modifier l'entraînement
      </Text>

      <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Card.Title>Date</Card.Title>
        <Button
          title={date.toLocaleDateString("fr-FR")}
          onPress={() => setShowPicker(true)}
          type="outline"
          buttonStyle={{ borderColor: colors.primary }}
          titleStyle={{ color: colors.primary }}
        />
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(_, selectedDate) => {
              if (selectedDate) setDate(selectedDate);
              setShowPicker(Platform.OS === "ios");
            }}
          />
        )}
      </Card>

      <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Card.Title>Photo (facultatif)</Card.Title>
        {photoPreview ? (
          <>
            <Image source={{ uri: photoPreview }} style={styles.photo} />
            <View style={styles.photoActions}>
              <Button
                title="Caméra"
                icon={{ name: "camera", type: "feather", size: 18 }}
                onPress={changePhotoFromCamera}
                buttonStyle={[styles.primaryButton, { backgroundColor: colors.primary }]}
              />
              <Button
                title="Galerie"
                type="outline"
                icon={{ name: "image", type: "feather", size: 18 }}
                onPress={changePhotoFromLibrary}
                buttonStyle={{ borderColor: colors.primary }}
                titleStyle={{ color: colors.primary }}
              />
              <Button
                title="Retirer"
                type="clear"
                icon={{ name: "trash-2", type: "feather", color: "#ff6b6b" }}
                titleStyle={{ color: "#ff6b6b" }}
                onPress={handleRemovePhoto}
              />
            </View>
          </>
        ) : (
          <View>
            <Text style={styles.placeholderText}>
              Aucune photo affichée pour cet entraînement.
            </Text>
            {!removePhoto && workout.photoURL && (
              <Button
                type="outline"
                title="Recharger la photo originale"
                onPress={handleResetPhoto}
                containerStyle={{ marginTop: 12 }}
                buttonStyle={{ borderColor: colors.primary }}
                titleStyle={{ color: colors.primary }}
              />
            )}
            <View style={styles.photoActions}>
              <Button
                title="Caméra"
                icon={{ name: "camera", type: "feather", size: 18 }}
                onPress={changePhotoFromCamera}
                buttonStyle={[styles.primaryButton, { backgroundColor: colors.primary }]}
              />
              <Button
                title="Galerie"
                type="outline"
                icon={{ name: "image", type: "feather", size: 18 }}
                onPress={changePhotoFromLibrary}
                buttonStyle={{ borderColor: colors.primary }}
                titleStyle={{ color: colors.primary }}
              />
            </View>
          </View>
        )}
      </Card>

      <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Card.Title>Type d'entraînement</Card.Title>
        <ButtonGroup
          buttons={typeOptions.map((t) => t.label)}
          selectedIndex={typeIndex}
          onPress={setTypeIndex}
          containerStyle={styles.buttonGroup}
          buttonContainerStyle={{ borderColor: colors.borderLight }}
          selectedButtonStyle={{ backgroundColor: colors.primary }}
          selectedTextStyle={{ color: "#fff" }}
          textStyle={{ color: colors.text }}
        />
      </Card>

      <Input
        label="Durée (minutes) *"
        value={duration}
        onChangeText={setDuration}
        keyboardType="numeric"
        leftIcon={<Icon type="feather" name="clock" size={18} />}
      />

      {currentType === "running" && (
        <Input
          label="Distance (km)"
          value={distance}
          onChangeText={setDistance}
          keyboardType="decimal-pad"
          leftIcon={<Icon type="feather" name="navigation" size={18} />}
        />
      )}

      {currentType === "musculation" && (
        <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Card.Title>Séance musculation</Card.Title>
          {exercises.map((exercise, index) => (
            <ListItem key={`${exercise.name}-${index}`} bottomDivider>
              <ListItem.Content>
                <ListItem.Title>{exercise.name}</ListItem.Title>
                <ListItem.Subtitle>
                  {exercise.sets} séries · {exercise.reps} reps
                </ListItem.Subtitle>
              </ListItem.Content>
              <Button
                type="clear"
                icon={{ name: "trash-2", type: "feather", color: "#ff6961" }}
                onPress={() => removeExercise(index)}
              />
            </ListItem>
          ))}
          <Input placeholder="Nom" value={exerciseName} onChangeText={setExerciseName} />
          <View style={styles.exerciseRow}>
            <Input
              placeholder="Séries"
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
              containerStyle={styles.halfField}
            />
            <Input
              placeholder="Reps"
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              containerStyle={styles.halfField}
            />
          </View>
          <Button title="+ Ajouter un exercice" type="outline" onPress={addExercise} />
        </Card>
      )}

      <Input
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
      />

      <Card containerStyle={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Card.Title>Ressenti : {feeling}/10</Card.Title>
        <Slider
          value={feeling}
          onValueChange={setFeeling}
          minimumValue={1}
          maximumValue={10}
          step={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <View style={styles.sliderLabels}>
          <Text>1</Text>
          <Text>10</Text>
        </View>
      </Card>

      <Button
        title="Enregistrer les modifications"
        onPress={handleSubmit}
        loading={submitting}
        containerStyle={styles.submitButton}
        buttonStyle={[styles.primaryButton, { backgroundColor: colors.primary }]}
        icon={{ name: "check", type: "feather", color: "white" }}
        iconRight
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 0,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginBottom: 12,
  },
  photoActions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  placeholderText: {
    textAlign: "center",
    color: "#888",
  },
  buttonGroup: {
    marginTop: 12,
  },
  exerciseRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  submitButton: {
    marginTop: 12,
  },
  primaryButton: {
    borderRadius: 12,
    minHeight: 48,
  },
});