import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import reminderService from "../services/reminderService";
import { typography } from "../theme/typography";

export const NotificationsScreen: React.FC<{ navigation: any }> = () => {
  const { colors } = useTheme();
  const [hour, setHour] = useState("18");
  const [minute, setMinute] = useState("30");
  const [reminders, setReminders] = useState<string[]>([]);

  const handleScheduleReminder = async () => {
    try {
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);

      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        Alert.alert("Erreur", "Heure et minutes invalides (0-23 et 0-59)");
        return;
      }

      const id = await reminderService.scheduleReminder(h, m, true);
      setReminders([...reminders, id]);
      Alert.alert(
        "Succès",
        `Rappel programmé pour ${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")} tous les jours`
      );
      setHour("18");
      setMinute("30");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de programmer le rappel");
      console.error(error);
    }
  };

  const handleCancelAll = async () => {
    try {
      await reminderService.cancelAllReminders();
      setReminders([]);
      Alert.alert("Succès", "Tous les rappels ont été annulés");
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'annuler les rappels");
      console.error(error);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.text }, typography.h2]}>
          Rappel d&apos;entraînement
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.textSecondary },
            typography.body,
          ]}
        >
          Reçois une alerte chaque jour à l&apos;heure de ton choix
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[{ color: colors.text }, typography.bodyMedium]}>
          Heure du rappel
        </Text>

        <View style={styles.timeInputs}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Heure
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="18"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={2}
              value={hour}
              onChangeText={setHour}
            />
          </View>

          <Text style={[styles.separator, { color: colors.text }]}>:</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Minutes
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="30"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={2}
              value={minute}
              onChangeText={setMinute}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleScheduleReminder}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, typography.bodyMedium]}>
            Programmer le rappel
          </Text>
        </TouchableOpacity>

        {reminders.length > 0 && (
          <>
            <Text
              style={[
                styles.remindersLabel,
                { color: colors.textSecondary },
                typography.small,
              ]}
            >
              {reminders.length} rappel{reminders.length > 1 ? "s" : ""} actif
              {reminders.length > 1 ? "s" : ""}
            </Text>
            <TouchableOpacity
              onPress={handleCancelAll}
              style={[styles.cancelButton, { backgroundColor: colors.border }]}
            >
              <Text style={[{ color: colors.text }, typography.bodyMedium]}>
                Annuler tous les rappels
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View
        style={[
          styles.infoBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[{ color: colors.text }, typography.small]}>
          💡 Les rappels sont sauvegardés localement sur ton téléphone et
          continueront à fonctionner même si l&apos;app est fermée.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 4 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  timeInputs: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 16,
    gap: 8,
  },
  inputGroup: { flex: 1 },
  label: { marginBottom: 4, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  separator: { fontSize: 20, marginBottom: 8, marginHorizontal: 4 },
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "white", fontWeight: "600" },
  remindersLabel: { marginTop: 12, textAlign: "center" },
  cancelButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
  },
  infoBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
});
