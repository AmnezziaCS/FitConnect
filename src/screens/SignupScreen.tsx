import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import authService from "../services/authService";
import { useAuthStore } from "../store/authStore";
import { typography } from "../theme/typography";

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const loadUserData = useAuthStore((state) => state.loadUserData);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }

    setLoading(true);
    try {
      await authService.signUpWithEmail(email, password, displayName);
      await loadUserData();
      navigation.replace("Main");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }, typography.h1]}>
            Créer un compte
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
              typography.body,
            ]}
          >
            Rejoins la communauté FitConnect
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nom d'utilisateur"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="John Doe"
            autoCapitalize="words"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="ton@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
          />

          <Input
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Button
            title="S'inscrire"
            onPress={handleSignup}
            loading={loading}
            fullWidth
            style={styles.signupButton}
          />

          <View style={styles.loginContainer}>
            <Text
              style={[
                styles.loginText,
                { color: colors.textSecondary },
                typography.body,
              ]}
            >
              Déjà un compte ?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text
                style={[
                  styles.loginLink,
                  { color: colors.primary },
                  typography.bodyMedium,
                ]}
              >
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  signupButton: {
    marginTop: 24,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  loginText: {},
  loginLink: {},
});
