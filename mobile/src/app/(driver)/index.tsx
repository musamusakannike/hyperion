import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Crypto from "expo-crypto";
import { AppHeader, Card, CopyButton, ErrorText, Field, PageIntro, PrimaryButton } from "@/components/ui";
import { KeyIcon } from "@/components/icons";
import { api, apiError } from "@/lib/api";
import { errorHaptic, successHaptic } from "@/lib/haptics";
import type { ScanResult } from "@/lib/types";
import { theme } from "@/theme";

export default function DriverBoardScreen() {
  const insets = useSafeAreaInsets();
  const [payload, setPayload] = useState("");
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState("");

  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchQr = async () => {
    setQrLoading(true);
    setQrError("");
    try {
      const { data } = await api.get<{ payload: string }>("/api/me/qr");
      setPayload(data.payload);
    } catch (err) {
      setQrError(apiError(err, "Could not load boarding QR"));
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    void fetchQr();
  }, []);

  const submitCard = async () => {
    if (!token) {
      setError("Enter the card number");
      return;
    }
    if (!pin) {
      setError("Enter the student's ride PIN");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const requestId = Crypto.randomUUID();
      const response = await api.post<ScanResult>(
        "/api/scans",
        { method: "rfid", token, pin, requestId },
        { validateStatus: (status) => status < 500 },
      );
      setResult(response.data);
      if (response.data.ok) {
        setToken("");
        setPin("");
        await successHaptic();
      } else {
        await errorHaptic();
      }
    } catch (err) {
      setError(apiError(err, "Charge request failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      <AppHeader title="Driver" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <PageIntro title="Show this code" subtitle="Students scan it to board. Use the form below for card taps." />

        <Card style={styles.qrCard}>
          {qrLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={styles.loadingText}>Loading boarding QR…</Text>
            </View>
          ) : qrError ? (
            <View style={styles.errorBox}>
              <ErrorText>{qrError}</ErrorText>
              <PrimaryButton onPress={fetchQr} style={styles.retryBtn}>
                Retry
              </PrimaryButton>
            </View>
          ) : (
            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={payload || "HYP:EMPTY"}
                  size={230}
                  color={theme.colors.textPrimary}
                  backgroundColor={theme.colors.white}
                />
              </View>
              <Text style={styles.payloadText} selectable>
                {payload}
              </Text>
              <CopyButton value={payload} label="Copy code" />
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Take a card fare</Text>
          <Text style={styles.cardSubtitle}>Ask for the PIN first. Then type the card number.</Text>
          <Field
            label="Student PIN"
            placeholder="e.g. 1234"
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
            value={pin}
            onChangeText={setPin}
            icon={<KeyIcon size={18} color={theme.colors.muted} />}
          />
          <Field label="RFID UID" placeholder="04A3B12C" value={token} onChangeText={setToken} />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton onPress={submitCard} loading={busy} disabled={busy || !token || !pin} style={styles.chargeBtn}>
            {busy ? "Checking…" : "Take 1 ride"}
          </PrimaryButton>
        </Card>

        {result ? (
          <Card style={[styles.resultCard, result.ok ? styles.resultCardSuccess : styles.resultCardError]}>
            <Text style={[styles.resultTitle, result.ok ? styles.resultTextSuccess : styles.resultTextError]}>
              {result.ok ? "Nice! Ride saved" : "Didn’t work"}
            </Text>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.studentName ? <Text style={styles.resultStudent}>{result.studentName}</Text> : null}
            {typeof result.remainingPoints === "number" ? (
              <Text style={styles.resultPoints}>{result.remainingPoints} rides left</Text>
            ) : null}
          </Card>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 16 },
  qrCard: { width: "100%", padding: 24, alignItems: "center", justifyContent: "center" },
  qrContainer: { alignItems: "center" },
  qrWrapper: {
    padding: 12,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  payloadText: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    marginTop: 16,
    textAlign: "center",
    fontFamily: "Courier",
  },
  loadingBox: { paddingVertical: 60, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 13, color: theme.colors.muted },
  errorBox: { width: "100%", paddingVertical: 20 },
  retryBtn: { marginTop: 12 },
  card: { padding: 18 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
  cardSubtitle: { fontSize: 13, color: theme.colors.muted, marginTop: 4, marginBottom: 14, lineHeight: 18 },
  chargeBtn: { marginTop: 6 },
  resultCard: { padding: 16 },
  resultCardSuccess: { backgroundColor: theme.colors.greenBg, borderColor: theme.colors.greenBorder },
  resultCardError: { backgroundColor: theme.colors.redBg, borderColor: theme.colors.redBorder },
  resultTitle: { fontSize: 16, fontWeight: "800" },
  resultTextSuccess: { color: theme.colors.greenText },
  resultTextError: { color: theme.colors.redText },
  resultMessage: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  resultStudent: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary, marginTop: 8 },
  resultPoints: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
});
