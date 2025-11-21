import React, { useEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useTheme } from "../contexts/ThemeContext";
import { usePedometer } from "../hooks/usePedometer";
import authService from "../services/authService";
import userService from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";

export const ProfileScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { totalSteps, isPedometerAvailable } = usePedometer();

  useEffect(() => {
    if (user && isPedometerAvailable) {
      updateSteps();
    }
  }, [totalSteps]);

  const updateSteps = async () => {
    if (!user) return;
    try {
      await userService.updateTotalSteps(user.id, totalSteps);
    } catch (error) {
      console.error("Error updating steps:", error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          try {
            await authService.signOut();
            signOut();
            navigation.replace("Login");
          } catch (error: any) {
            Alert.alert("Erreur", error.message);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données seront supprimées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              await authService.deleteAccount(user.id);
              signOut();
              navigation.replace("Login");
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  if (!user) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={{ color: colors.text, ...typography.body }}>
          Chargement du profil...
        </Text>
        <Button title="Déconnexion" onPress={handleSignOut} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Image
          source={{ uri: user.photoURL || "https://via.placeholder.com/120" }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: colors.text }, typography.h2]}>
          {user.displayName}
        </Text>
        <Text
          style={[
            styles.email,
            { color: colors.textSecondary },
            typography.body,
          ]}
        >
          {user.email}
        </Text>
        {user.bio && (
          <Text style={[styles.bio, { color: colors.text }, typography.body]}>
            {user.bio}
          </Text>
        )}
        {user.favoriteSport && (
          <View
            style={[styles.sportBadge, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.sportText, typography.smallMedium]}>
              {user.favoriteSport}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Stats */}
        <Card style={styles.statsCard}>
          <Text
            style={[styles.statsTitle, { color: colors.text }, typography.h4]}
          >
            Statistiques
          </Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text
                style={[
                  styles.statValue,
                  { color: colors.primary },
                  typography.h3,
                ]}
              >
                {isPedometerAvailable ? totalSteps.toLocaleString() : "N/A"}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.textSecondary },
                  typography.small,
                ]}
              >
                Pas totaux
              </Text>
            </View>
            <View style={styles.stat}>
              <Text
                style={[
                  styles.statValue,
                  { color: colors.primary },
                  typography.h3,
                ]}
              >
                {user.friends.length}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: colors.textSecondary },
                  typography.small,
                ]}
              >
                Amis
              </Text>
            </View>
          </View>
        </Card>

        {/* Theme */}
        <Card style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }, typography.h4]}
          >
            Apparence
          </Text>
          <View style={styles.themeButtons}>
            {(["light", "dark", "system"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setThemeMode(mode)}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor:
                      themeMode === mode ? colors.primary : colors.surface,
                    borderColor:
                      themeMode === mode ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeMode === mode ? "#FFFFFF" : colors.text },
                    typography.small,
                  ]}
                >
                  {mode === "light"
                    ? "☀️ Clair"
                    : mode === "dark"
                    ? "🌙 Sombre"
                    : "⚙️ Auto"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Actions */}
        <Card style={styles.section}>
          <Button
            title="Modifier le profil"
            onPress={handleEditProfile}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
          <Button
            title="Mes entraînements"
            onPress={() => navigation.navigate("MyWorkouts")}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
          <Button
            title="Notifications"
            onPress={() => navigation.navigate("Notifications")}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
        </Card>

        <Button
          title="Déconnexion"
          onPress={handleSignOut}
          variant="outline"
          fullWidth
          style={styles.signOutButton}
        />

        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={styles.deleteButton}
        >
          <Text
            style={[
              styles.deleteButtonText,
              { color: colors.error },
              typography.small,
            ]}
          >
            Supprimer mon compte
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    marginBottom: 4,
  },
  email: {
    marginBottom: 12,
  },
  bio: {
    textAlign: "center",
    marginBottom: 12,
  },
  sportBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sportText: {
    color: "#FFFFFF",
  },
  content: {
    padding: 20,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    marginBottom: 16,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {},
  statLabel: {},
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  themeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  themeButtonText: {},
  actionButton: {
    marginBottom: 8,
  },
  signOutButton: {
    marginTop: 8,
  },
  deleteButton: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteButtonText: {},
});
