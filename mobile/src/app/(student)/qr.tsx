import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, ErrorText, PrimaryButton } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import { theme } from "@/theme";

export default function StudentQrScreen() {
  const insets = useSafeAreaInsets();
  const [payload, setPayload] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQr = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<{ payload: string }>("/api/me/qr");
      setPayload(data.payload);
    } catch (err) {
      setError(apiError(err, "Could not load QR code"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQr();
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Your QR" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Show this to the driver</Text>
          <Text style={styles.subtitle}>
            Same code works until you rotate it. RFID will use the same wallet.
          </Text>
        </View>

        <Card style={styles.qrCard}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={styles.loadingText}>Loading your QR…</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <ErrorText>{error}</ErrorText>
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
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: 20,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 300,
  },
  qrCard: {
    width: "100%",
    maxWidth: 340,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  qrContainer: {
    alignItems: "center",
  },
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
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  errorBox: {
    width: "100%",
    paddingVertical: 20,
  },
  retryBtn: {
    marginTop: 12,
  },
});
