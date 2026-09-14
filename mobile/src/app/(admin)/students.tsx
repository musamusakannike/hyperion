import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, ErrorText, Field, PageIntro, PrimaryButton, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import { theme } from "@/theme";
import { successHaptic } from "@/lib/haptics";

export default function AddStudentScreen() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    matricNumber: "",
    password: "StudentPass1!",
    pin: "1234",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      <AppHeader title="Add student" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageIntro title="Add a student" subtitle="They can log in and buy rides." />
        <Card>
          <Field label="Full name" value={form.fullName} onChangeText={(v) => setForm((p) => ({ ...p, fullName: v }))} />
          <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} />
          <Field label="Matric number" value={form.matricNumber} onChangeText={(v) => setForm((p) => ({ ...p, matricNumber: v }))} />
          <Field label="Ride PIN" hint="4–6 numbers" keyboardType="numeric" value={form.pin} onChangeText={(v) => setForm((p) => ({ ...p, pin: v }))} />
          <ErrorText>{error}</ErrorText>
          <SuccessText>{ok}</SuccessText>
          <PrimaryButton
            loading={busy}
            onPress={async () => {
              setBusy(true);
              setError("");
              setOk("");
              try {
                await api.post("/api/admin/students", form);
                setOk(`Created ${form.fullName}`);
                await successHaptic();
                setForm({ fullName: "", email: "", matricNumber: "", password: "StudentPass1!", pin: "1234" });
              } catch (err) {
                setError(apiError(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            Create student
          </PrimaryButton>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 16, gap: 12 },
});
