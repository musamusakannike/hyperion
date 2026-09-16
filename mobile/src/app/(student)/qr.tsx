import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Crypto from "expo-crypto";
import { AppHeader, Card, ErrorText, Field, PageIntro, PrimaryButton } from "@/components/ui";
import { CameraIcon } from "@/components/icons";
import { api, apiError } from "@/lib/api";
import { errorHaptic, successHaptic } from "@/lib/haptics";
import type { ScanResult } from "@/lib/types";
import { theme } from "@/theme";

export default function StudentScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const submit = async (scanToken: string) => {
    if (!scanToken) {
      setError("Scan or paste the driver QR");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const requestId = Crypto.randomUUID();
      const response = await api.post<ScanResult>(
        "/api/scans",
        { method: "qr", token: scanToken, requestId },
        { validateStatus: (status) => status < 500 },
      );
      setResult(response.data);
      if (response.data.ok) {
        setToken("");
        await successHaptic();
      } else {
        await errorHaptic();
      }
    } catch (err) {
      setError(apiError(err, "Board request failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!camOn || isScanning) return;
    setIsScanning(true);
    setToken(data);
    setCamOn(false);
    setIsScanning(false);
    void submit(data);
  };

  const toggleCamera = async () => {
    if (!camOn) {
      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          setError("Camera permission is required to scan the driver QR");
          return;
        }
      }
      setCamOn(true);
    } else {
      setCamOn(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      <AppHeader title="Board" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <PageIntro title="Scan the driver" subtitle="Point your camera at the QR on the driver’s phone." />

        <Card style={styles.card}>
          <Field label="Driver QR" placeholder="HYP:…" value={token} onChangeText={setToken} />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton onPress={() => submit(token)} loading={busy} disabled={busy || !token} style={styles.chargeBtn}>
            {busy ? "Checking…" : "Board (1 ride)"}
          </PrimaryButton>
          <PrimaryButton variant="outline" onPress={toggleCamera} style={styles.cameraToggleBtn}>
            <View style={styles.cameraBtnContent}>
              <CameraIcon size={18} color={theme.colors.textSecondary} />
              <Text style={styles.cameraBtnText}>{camOn ? "Stop camera" : "Open camera"}</Text>
            </View>
          </PrimaryButton>
          {camOn ? (
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.cameraView}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarcodeScanned}
              >
                <View style={styles.cameraOverlay}>
                  <View style={styles.scanTarget} />
                  <Text style={styles.cameraHint}>Align driver QR inside box</Text>
                </View>
              </CameraView>
            </View>
          ) : null}
        </Card>

        {result ? (
          <Card style={[styles.resultCard, result.ok ? styles.resultCardSuccess : styles.resultCardError]}>
            <Text style={[styles.resultTitle, result.ok ? styles.resultTextSuccess : styles.resultTextError]}>
              {result.ok ? "You’re on board" : "Didn’t work"}
            </Text>
            <Text style={styles.resultMessage}>{result.message}</Text>
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
  card: { padding: 18 },
  chargeBtn: { marginTop: 6 },
  cameraToggleBtn: { marginTop: 10 },
  cameraBtnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  cameraBtnText: { fontSize: 14, fontWeight: "600", color: theme.colors.textSecondary },
  cameraContainer: {
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cameraView: { flex: 1 },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanTarget: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderColor: theme.colors.white,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  cameraHint: { color: theme.colors.white, fontSize: 12, fontWeight: "600", marginTop: 12 },
  resultCard: { padding: 16 },
  resultCardSuccess: { backgroundColor: theme.colors.greenBg, borderColor: theme.colors.greenBorder },
  resultCardError: { backgroundColor: theme.colors.redBg, borderColor: theme.colors.redBorder },
  resultTitle: { fontSize: 16, fontWeight: "800" },
  resultTextSuccess: { color: theme.colors.greenText },
  resultTextError: { color: theme.colors.redText },
  resultMessage: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  resultPoints: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
});
