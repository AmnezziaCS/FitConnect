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
import userService from "../services/userService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";

const SPORTS = [
  "Boxe",
  "Running",
  "Musculation",
  "Yoga",
  "Natation",
  "Cyclisme",
  "CrossFit",
  "Danse",
  "Football",
  "Basketball",
  "Tennis",
  "Autre",
];

export const EditProfileScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const loadUserData = useAuthStore((state) => state.loadUserData);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [favoriteSport, setFavoriteSport] = useState(user?.favoriteSport || "");
  const [photoURI, setPhotoURI] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès à la galerie"
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoURI(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      Alert.alert("Erreur", "Le nom est requis");
      return;
    }

    setLoading(true);
    try {
      await userService.updateProfile(user.id, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        favoriteSport: favoriteSport || undefined,
        photoURI: photoURI || undefined,
      });

      await loadUserData();

      Alert.alert("Succès", "Profil mis à jour !", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentPhoto = photoURI || user?.photoURL;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* Photo de profil */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={{
                uri: currentPhoto || "https://via.placeholder.com/120",
              }}
              style={styles.avatar}
            />
            <View
              style={[styles.editBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.editIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text
            style={[
              styles.photoHint,
              { color: colors.textSecondary },
              typography.caption,
            ]}
          >
            Appuyez pour changer la photo
          </Text>
        </View>

        {/* Nom */}
        <Input
          label="Nom d'affichage *"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="John Doe"
          autoCapitalize="words"
        />

        {/* Bio */}
        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Parle-nous de toi..."
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: "top" }}
          containerStyle={styles.bioInput}
        />

        {/* Sport favori */}
        <Text
          style={[styles.label, { color: colors.text }, typography.bodyMedium]}
        >
          Sport favori
        </Text>
        <View style={styles.sportsGrid}>
          {SPORTS.map((sport) => (
            <TouchableOpacity
              key={sport}
              onPress={() => setFavoriteSport(sport)}
              style={[
                styles.sportButton,
                {
                  backgroundColor:
                    favoriteSport === sport ? colors.primary : colors.surface,
                  borderColor:
                    favoriteSport === sport ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sportText,
                  {
                    color: favoriteSport === sport ? "#FFFFFF" : colors.text,
                  },
                  typography.small,
                ]}
              >
                {sport}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Enregistrer"
          onPress={handleSave}
          loading={loading}
          fullWidth
          style={styles.saveButton}
        />

        <Button
          title="Annuler"
          onPress={() => navigation.goBack()}
          variant="outline"
          fullWidth
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
  photoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  editIcon: {
    fontSize: 18,
  },
  photoHint: {
    marginTop: 8,
  },
  bioInput: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
  },
  sportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 32,
  },
  sportButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  sportText: {},
  saveButton: {
    marginBottom: 12,
  },
});
