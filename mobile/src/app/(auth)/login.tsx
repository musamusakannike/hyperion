import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, ErrorText, Field, PrimaryButton } from "@/components/ui";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, ShieldIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { apiError } from "@/lib/api";
import { theme } from "@/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in both email and password");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(apiError(err, "Could not sign in"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <Avatar name="H" size="lg" />
          <Text style={styles.title}>WELCOME BACK</Text>
          <Text style={styles.subtitle}>Hyperion ride points</Text>
          <Text style={styles.caption}>Sign in to your student, driver, or admin account</Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            icon={<MailIcon size={18} color={theme.colors.muted} />}
          />

          <Field
            label="Password"
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            icon={<LockIcon size={18} color={theme.colors.muted} />}
            trailing={
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPassword ? (
                  <EyeOffIcon size={18} color={theme.colors.muted} />
                ) : (
                  <EyeIcon size={18} color={theme.colors.muted} />
                )}
              </TouchableOpacity>
            }
          />

          <ErrorText>{error}</ErrorText>

          <PrimaryButton onPress={onSubmit} loading={busy} disabled={busy} style={styles.submitBtn}>
            Sign In
          </PrimaryButton>
        </View>

        <View style={styles.signupSection}>
          <Text style={styles.signupPrompt}>Don't have an account?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(auth)/register" as any)}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ShieldIcon size={16} color={theme.colors.muted} />
          <Text style={styles.footerText}>Secure login protected by Hyperion</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  headerSection: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: theme.colors.textPrimary,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  caption: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  submitBtn: {
    marginTop: 8,
  },
  signupSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 6,
  },
  signupPrompt: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 8,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.muted,
  },
});
