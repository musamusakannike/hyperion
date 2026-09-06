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
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Crypto from "expo-crypto";
import { AppHeader, Card, ErrorText, Field, PrimaryButton } from "@/components/ui";
import { CameraIcon, KeyIcon } from "@/components/icons";
import { api, apiError } from "@/lib/api";
import type { ScanResult } from "@/lib/types";
import { theme } from "@/theme";

export default function DriverScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [method, setMethod] = useState<"qr" | "rfid">("qr");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const submit = async (scanToken: string, scanMethod: "qr" | "rfid") => {
    if (!scanToken) {
      setError("Please provide a QR payload or RFID UID");
      return;
    }
    if (!pin) {
      setError("Please enter the student's ride PIN");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const requestId = Crypto.randomUUID();
      const response = await api.post<ScanResult>(
        "/api/scans",
        {
          method: scanMethod,
          token: scanToken,
          pin,
          requestId,
        },
        { validateStatus: (status) => status < 500 },
      );
      setResult(response.data);
      if (response.data.ok) {
        setToken("");
        setPin("");
      }
    } catch (err) {
      setError(apiError(err, "Charge request failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!camOn || isScanning) return;
    setIsScanning(true);
    setToken(data);
    setMethod("qr");
    setCamOn(false);
    setIsScanning(false);
    if (pin) {
      void submit(data, "qr");
    }
  };

  const toggleCamera = async () => {
    if (!camOn) {
      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          setError("Camera permission is required to scan QR codes");
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
      <AppHeader title="Driver" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Scan a ride</Text>
          <Text style={styles.cardSubtitle}>
            Ask for the student PIN, then scan their QR or type an RFID UID.
          </Text>

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

          {/* Method Selector */}
          <Text style={styles.methodLabel}>Verification method</Text>
          <View style={styles.methodToggleRow}>
            {(["qr", "rfid"] as const).map((m) => {
              const active = method === m;
              return (
                <TouchableOpacity
                  key={m}
                  activeOpacity={0.8}
                  onPress={() => setMethod(m)}
                  style={[styles.methodBtn, active && styles.methodBtnActive]}
                >
                  <Text style={[styles.methodBtnText, active && styles.methodBtnTextActive]}>
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Field
            label={method === "qr" ? "QR payload" : "RFID UID"}
            placeholder={method === "qr" ? "HYP:…" : "04A3B12C"}
            value={token}
            onChangeText={setToken}
          />

          <ErrorText>{error}</ErrorText>

          <PrimaryButton
            onPress={() => submit(token, method)}
            loading={busy}
            disabled={busy || !token || !pin}
            style={styles.chargeBtn}
          >
            {busy ? "Checking…" : "Charge 1 point"}
          </PrimaryButton>

          {/* Camera Button */}
          <PrimaryButton
            variant="outline"
            onPress={toggleCamera}
            style={styles.cameraToggleBtn}
          >
            <View style={styles.cameraBtnContent}>
              <CameraIcon size={18} color={theme.colors.textSecondary} />
              <Text style={styles.cameraBtnText}>{camOn ? "Stop camera" : "Open camera"}</Text>
            </View>
          </PrimaryButton>

          {/* Live Camera View */}
          {camOn ? (
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.cameraView}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              >
                <View style={styles.cameraOverlay}>
                  <View style={styles.scanTarget} />
                  <Text style={styles.cameraHint}>Align QR code inside box</Text>
                </View>
              </CameraView>
            </View>
          ) : null}
        </Card>

        {/* Scan Result Feedback Card */}
        {result ? (
          <Card
            style={[
              styles.resultCard,
              result.ok ? styles.resultCardSuccess : styles.resultCardError,
            ]}
          >
            <Text style={[styles.resultTitle, result.ok ? styles.resultTextSuccess : styles.resultTextError]}>
              {result.ok ? "Ride recorded" : "Scan failed"}
            </Text>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.studentName ? (
              <Text style={styles.resultStudent}>{result.studentName}</Text>
            ) : null}
            {typeof result.remainingPoints === "number" ? (
              <Text style={styles.resultPoints}>{result.remainingPoints} pts left</Text>
            ) : null}
          </Card>
        ) : null}
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  methodToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: theme.colors.cardHover,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  methodBtnActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  methodBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  methodBtnTextActive: {
    color: theme.colors.white,
  },
  chargeBtn: {
    marginTop: 6,
  },
  cameraToggleBtn: {
    marginTop: 10,
  },
  cameraBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cameraBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  cameraContainer: {
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cameraView: {
    flex: 1,
  },
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
  cameraHint: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
  resultCard: {
    padding: 16,
  },
  resultCardSuccess: {
    backgroundColor: theme.colors.greenBg,
    borderColor: theme.colors.greenBorder,
  },
  resultCardError: {
    backgroundColor: theme.colors.redBg,
    borderColor: theme.colors.redBorder,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  resultTextSuccess: {
    color: theme.colors.greenText,
  },
  resultTextError: {
    color: theme.colors.redText,
  },
  resultMessage: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  resultStudent: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  resultPoints: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
});
