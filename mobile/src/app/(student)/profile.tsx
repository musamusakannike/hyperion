import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, ErrorText, Field, PrimaryButton, StatusBadge } from "@/components/ui";
import { KeyIcon, LockIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { api, apiError } from "@/lib/api";
import { theme } from "@/theme";

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const savePin = async () => {
    if (!currentPin || !newPin) {
      setError("Please fill in both current and new PIN");
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      setError("New PIN must be 4 to 6 digits");
      return;
    }

    setBusy(true);
    setError("");
    setMsg("");
    try {
      await api.post("/api/auth/pin", { currentPin, newPin });
      setMsg("PIN updated successfully");
      setCurrentPin("");
      setNewPin("");
    } catch (err) {
      setError(apiError(err, "Could not update PIN"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      <AppHeader title="Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* User Card */}
        <Card style={styles.card}>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userMeta}>Matric · {user?.matricNumber || "N/A"}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge
              ok={!!user?.hasRfid}
              label={user?.hasRfid ? "RFID card bound" : "No RFID card yet"}
            />
          </View>
        </Card>

        {/* Change PIN Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Change ride PIN</Text>
          <Text style={styles.cardSubtitle}>
            Your ride PIN authorizes shuttle trips when scanned by the driver.
          </Text>

          <Field
            label="Current PIN"
            placeholder="Enter current PIN"
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
            value={currentPin}
            onChangeText={setCurrentPin}
            icon={<LockIcon size={18} color={theme.colors.muted} />}
          />

          <Field
            label="New PIN (4–6 digits)"
            placeholder="Enter new 4–6 digit PIN"
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
            value={newPin}
            onChangeText={setNewPin}
            icon={<KeyIcon size={18} color={theme.colors.muted} />}
          />

          <ErrorText>{error}</ErrorText>

          {msg ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{msg}</Text>
            </View>
          ) : null}

          <PrimaryButton
            onPress={savePin}
            loading={busy}
            disabled={busy}
            style={styles.updatePinBtn}
          >
            Update PIN
          </PrimaryButton>
        </Card>

        {/* Sign Out Button */}
        <PrimaryButton
          variant="outline"
          onPress={logout}
          style={styles.signOutBtn}
        >
          Sign out
        </PrimaryButton>
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
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    padding: 18,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 4,
  },
  userMeta: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  updatePinBtn: {
    marginTop: 8,
  },
  successBanner: {
    backgroundColor: theme.colors.greenBg,
    borderColor: theme.colors.greenBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
  successText: {
    color: theme.colors.greenText,
    fontSize: 13,
    fontWeight: "600",
  },
  signOutBtn: {
    marginTop: 8,
  },
});
