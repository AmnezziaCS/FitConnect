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

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const loadUserData = useAuthStore((state) => state.loadUserData);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      await authService.signInWithEmail(email, password);
      await loadUserData();
      navigation.replace("Main");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      await loadUserData();
      navigation.replace("Main");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert(
        "Non disponible",
        "La connexion Apple est disponible uniquement sur iOS"
      );
      return;
    }

    setLoading(true);
    try {
      await authService.signInWithApple();
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
            FitConnect
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
              typography.body,
            ]}
          >
            Ton réseau social sportif
          </Text>
        </View>

        <View style={styles.form}>
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
            placeholder="••••••••"
            secureTextEntry
          />

          <Button
            title="Se connecter"
            onPress={handleEmailLogin}
            loading={loading}
            fullWidth
            style={styles.loginButton}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotPassword}
          >
            <Text
              style={[
                styles.forgotPasswordText,
                { color: colors.primary },
                typography.small,
              ]}
            >
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text
              style={[
                styles.dividerText,
                { color: colors.textTertiary },
                typography.small,
              ]}
            >
              OU
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          <Button
            title="Continuer avec Google"
            onPress={handleGoogleLogin}
            variant="outline"
            fullWidth
            style={styles.socialButton}
          />

          {Platform.OS === "ios" && (
            <Button
              title="Continuer avec Apple"
              onPress={handleAppleLogin}
              variant="outline"
              fullWidth
              style={styles.socialButton}
            />
          )}

          <View style={styles.signupContainer}>
            <Text
              style={[
                styles.signupText,
                { color: colors.textSecondary },
                typography.body,
              ]}
            >
              Pas encore de compte ?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text
                style={[
                  styles.signupLink,
                  { color: colors.primary },
                  typography.bodyMedium,
                ]}
              >
                S'inscrire
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
  loginButton: {
    marginTop: 8,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  forgotPasswordText: {},
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  socialButton: {
    marginBottom: 12,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  signupText: {},
  signupLink: {},
});
