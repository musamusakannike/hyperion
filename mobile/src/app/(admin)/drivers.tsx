import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, ErrorText, Field, PageIntro, PrimaryButton, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import { theme } from "@/theme";
import { successHaptic } from "@/lib/haptics";

export default function AddDriverScreen() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ fullName: "", email: "", password: "DriverPass1!" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      <AppHeader title="Add driver" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageIntro title="Add a driver" subtitle="Drivers scan QR codes and cards." />
        <Card>
          <Field label="Full name" value={form.fullName} onChangeText={(v) => setForm((p) => ({ ...p, fullName: v }))} />
          <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} />
          <ErrorText>{error}</ErrorText>
          <SuccessText>{ok}</SuccessText>
          <PrimaryButton
            loading={busy}
            onPress={async () => {
              setBusy(true);
              setError("");
              setOk("");
              try {
                await api.post("/api/admin/drivers", form);
                setOk(`Created ${form.fullName}`);
                await successHaptic();
                setForm({ fullName: "", email: "", password: "DriverPass1!" });
              } catch (err) {
                setError(apiError(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            Create driver
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
