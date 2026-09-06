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
import { ErrorText, Field, PrimaryButton } from "@/components/ui";
import { HashIcon, KeyIcon, LockIcon, MailIcon, UserIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { apiError } from "@/lib/api";
import { theme } from "@/theme";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    matricNumber: "",
    password: "",
    pin: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const setField = (key: keyof typeof form, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const onSubmit = async () => {
    if (!form.fullName || !form.email || !form.matricNumber || !form.password || !form.pin) {
      setError("Please fill in all fields");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/^\d{4,6}$/.test(form.pin)) {
      setError("PIN must be 4 to 6 digits");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await register(form);
    } catch (err) {
      setError(apiError(err, "Could not create account"));
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
          <Text style={styles.title}>CREATE ACCOUNT</Text>
          <Text style={styles.caption}>
            Students only. Drivers and admins are created by Hyperion staff.
          </Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Full name"
            placeholder="e.g. Adewale Bakare"
            value={form.fullName}
            onChangeText={(v) => setField("fullName", v)}
            icon={<UserIcon size={18} color={theme.colors.muted} />}
          />

          <Field
            label="Email"
            placeholder="student@university.edu.ng"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            icon={<MailIcon size={18} color={theme.colors.muted} />}
          />

          <Field
            label="Matric number"
            placeholder="e.g. 19/52HA001"
            autoCapitalize="characters"
            value={form.matricNumber}
            onChangeText={(v) => setField("matricNumber", v)}
            icon={<HashIcon size={18} color={theme.colors.muted} />}
          />

          <Field
            label="Password"
            placeholder="At least 8 characters"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            icon={<LockIcon size={18} color={theme.colors.muted} />}
          />

          <Field
            label="Ride PIN (4–6 digits)"
            placeholder="1234"
            keyboardType="numeric"
            maxLength={6}
            value={form.pin}
            onChangeText={(v) => setField("pin", v)}
            icon={<KeyIcon size={18} color={theme.colors.muted} />}
          />

          <ErrorText>{error}</ErrorText>

          <PrimaryButton onPress={onSubmit} loading={busy} disabled={busy} style={styles.submitBtn}>
            Sign up
          </PrimaryButton>
        </View>

        <View style={styles.signinSection}>
          <Text style={styles.signinPrompt}>Already have an account?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace("/(auth)/login" as any)}>
            <Text style={styles.signinLink}>Sign in</Text>
          </TouchableOpacity>
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
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: theme.colors.textPrimary,
  },
  caption: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 6,
    lineHeight: 18,
  },
  form: {
    width: "100%",
  },
  submitBtn: {
    marginTop: 10,
  },
  signinSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
    gap: 6,
  },
  signinPrompt: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  signinLink: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.accent,
  },
});
