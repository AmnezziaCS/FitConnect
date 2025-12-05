import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import workoutService from "../services/workoutService";
import { useAuthStore } from "../store/authStore";
import { Exercise, RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "AddWorkout">;

const workoutTypes: {
  label: string;
  value: "musculation" | "running" | "other";
}[] = [
  { label: "Musculation", value: "musculation" },
  { label: "Course", value: "running" },
  { label: "Autre", value: "other" },
];

export const AddWorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const { colors } = useTheme();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [typeIndex, setTypeIndex] = useState(0);
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [feeling, setFeeling] = useState(6);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentType = useMemo(
    () => workoutTypes[typeIndex].value as "musculation" | "running" | "other",
    [typeIndex]
  );

  const askPermission = async (permission: ImagePicker.PermissionStatus) => {
    if (permission !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert(
        "Autorisation requise",
        "Nous avons besoin d'accéder à la caméra ou à la galerie."
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (!(await askPermission(status))) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!(await askPermission(status))) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
  };

  const addExercise = () => {
    if (!exerciseName || !sets || !reps) {
      return Alert.alert(
        "Champs manquants",
        "Complète l'exercice avant d'ajouter"
      );
    }

    setExercises((prev) => [
      ...prev,
      {
        name: exerciseName,
        sets: Number(sets),
        reps: Number(reps),
      },
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
      Alert.alert(
        "Connexion requise",
        "Reconnecte-toi pour ajouter un entraînement"
      );
      return false;
    }

    if (!duration || Number(duration) <= 0) {
      Alert.alert("Durée obligatoire", "Indique la durée de l'entraînement.");
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
    if (!validate() || !user) return;

    try {
      setSubmitting(true);
      await workoutService.addWorkout(
        user.id,
        user.displayName,
        user.photoURL,
        {
          date,
          duration: Number(duration),
          notes,
          feeling,
          photoURI: photo || undefined,
          type: currentType,
          exercises: currentType === "musculation" ? exercises : undefined,
          distance: currentType === "running" ? Number(distance) : undefined,
        }
      );
      Alert.alert("Bravo !", "Ton entraînement a été publié.");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.message || "Impossible d'enregistrer l'entraînement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text h3 style={[styles.screenTitle, { color: colors.text }]}>
        Nouvel entraînement
      </Text>
      <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
        Partage ta séance avec tes amis 💪
      </Text>

      <Card
        containerStyle={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
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

      <Card
        containerStyle={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Card.Title>Photo (facultatif)</Card.Title>
        {photo ? (
          <>
            <Image source={{ uri: photo }} style={styles.photo} />
            <View style={styles.photoActions}>
              <Button
                title="Reprendre"
                icon={{ name: "camera", type: "feather", size: 18 }}
                onPress={handleTakePhoto}
                buttonStyle={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Button
                title="Bibliothèque"
                type="outline"
                icon={{ name: "image", type: "feather", size: 18 }}
                onPress={handlePickPhoto}
                buttonStyle={{ borderColor: colors.primary }}
                titleStyle={{ color: colors.primary }}
                iconContainerStyle={{ marginRight: 6 }}
              />
              <Button
                title="Retirer"
                type="clear"
                icon={{
                  name: "trash-2",
                  type: "feather",
                  size: 18,
                  color: "#ff6b6b",
                }}
                onPress={handleRemovePhoto}
                titleStyle={{ color: "#ff6b6b" }}
              />
            </View>
          </>
        ) : (
          <View style={styles.photoActions}>
            <Button
              title="Prendre une photo"
              icon={{ name: "camera", type: "feather", size: 18 }}
              onPress={handleTakePhoto}
              buttonStyle={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
            />
            <Button
              title="Depuis la galerie"
              type="outline"
              icon={{ name: "image", type: "feather", size: 18 }}
              onPress={handlePickPhoto}
              buttonStyle={{ borderColor: colors.primary }}
              titleStyle={{ color: colors.primary }}
            />
          </View>
        )}
      </Card>

      <Card
        containerStyle={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Card.Title>Type d&apos;entraînement</Card.Title>
        <ButtonGroup
          buttons={workoutTypes.map((t) => t.label)}
          selectedIndex={typeIndex}
          onPress={setTypeIndex}
          containerStyle={styles.buttonGroup}
          buttonContainerStyle={{ borderColor: colors.borderLight }}
          textStyle={{ color: colors.text }}
          selectedButtonStyle={{ backgroundColor: colors.primary }}
          selectedTextStyle={{ color: "#fff" }}
        />
      </Card>

      <Input
        label="Durée (minutes) *"
        value={duration}
        onChangeText={setDuration}
        keyboardType="numeric"
        placeholder="45"
        leftIcon={<Icon type="feather" name="clock" size={18} />}
      />

      {currentType === "running" && (
        <Input
          label="Distance (km) *"
          value={distance}
          onChangeText={setDistance}
          keyboardType="decimal-pad"
          placeholder="5.2"
          leftIcon={<Icon type="feather" name="navigation" size={18} />}
        />
      )}

      {currentType === "musculation" && (
        <Card
          containerStyle={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Card.Title>Séance de musculation</Card.Title>
          {exercises.length === 0 && (
            <Text style={styles.placeholderText}>
              Ajoute tes exercices (nom + séries + reps)
            </Text>
          )}
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
                icon={{
                  name: "trash-2",
                  type: "feather",
                  color: "#ff6961",
                  size: 18,
                }}
                onPress={() => removeExercise(index)}
              />
            </ListItem>
          ))}
          <Input
            placeholder="Nom de l'exercice"
            value={exerciseName}
            onChangeText={setExerciseName}
          />
          <View style={styles.exerciseRow}>
            <Input
              placeholder="Séries"
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
              containerStyle={styles.halfField}
            />
            <Input
              placeholder="Répétitions"
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              containerStyle={styles.halfField}
            />
          </View>
          <Button
            title="+ Ajouter un exercice"
            type="outline"
            onPress={addExercise}
          />
        </Card>
      )}

      <Input
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Sensations, météo, chrono, etc."
        multiline
        numberOfLines={4}
      />

      <Card
        containerStyle={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Card.Title>Ressenti global : {feeling}/10</Card.Title>
        <Slider
          value={feeling}
          onValueChange={setFeeling}
          step={1}
          minimumValue={1}
          maximumValue={10}
          thumbStyle={styles.sliderThumb}
          maximumTrackTintColor={colors.border}
          minimumTrackTintColor={colors.primary}
        />
        <View style={styles.sliderLabels}>
          <Text>1</Text>
          <Text>10</Text>
        </View>
      </Card>

      <Button
        title="Publier l'entraînement"
        onPress={handleSubmit}
        loading={submitting}
        containerStyle={styles.submitButton}
        buttonStyle={[
          styles.primaryButton,
          { backgroundColor: colors.primary },
        ]}
        titleStyle={{ fontWeight: "600", letterSpacing: 0.5 }}
        icon={{
          name: "send",
          type: "feather",
          color: "white",
        }}
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
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 0,
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
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  buttonGroup: {
    marginTop: 12,
  },
  placeholderText: {
    textAlign: "center",
    color: "#888",
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  sliderThumb: {
    width: 20,
    height: 20,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  submitButton: {
    marginTop: 16,
  },
  primaryButton: {
    borderRadius: 12,
    minHeight: 48,
  },
  screenTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  screenSubtitle: {
    marginBottom: 16,
  },
});
