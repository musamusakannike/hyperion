import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, ErrorText, Field, PrimaryButton } from "@/components/ui";
import { CopyIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { api, apiError } from "@/lib/api";
import { theme } from "@/theme";

type WalletData = {
  ridePoints: number;
  leftoverKobo: number;
  ridePriceKobo: number;
  dedicatedAccount?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
};

export default function StudentFundScreen() {
  const insets = useSafeAreaInsets();
  const { user, refresh } = useAuth();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [amountNaira, setAmountNaira] = useState("250");
  const [paymentError, setPaymentError] = useState("");
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  const loadWallet = useCallback(async () => {
    try {
      const { data } = await api.get<WalletData>("/api/me/wallet");
      setWallet(data);
    } catch {
      // fallback
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadWallet()]);
    setRefreshing(false);
  }, [refresh, loadWallet]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const acct = wallet?.dedicatedAccount ?? user?.dedicatedAccount;

  const copy = async (value?: string, key?: string) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    setCopiedKey(key ?? "ok");
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const startPayment = async () => {
    const amount = Number(amountNaira);
    if (isNaN(amount) || amount < 100) {
      setPaymentError("Minimum payment amount is ₦100");
      return;
    }

    setPaymentError("");
    setIsStartingPayment(true);
    try {
      const { data } = await api.post<{ authorizationUrl: string }>("/api/me/funding/initialize", {
        amountNaira: amount,
      });

      // Open in in-app browser
      await WebBrowser.openBrowserAsync(data.authorizationUrl);

      // Refresh wallet & auth after user returns
      await Promise.all([refresh(), loadWallet()]);
    } catch (error) {
      setPaymentError(apiError(error, "Could not start your Paystack payment"));
    } finally {
      setIsStartingPayment(false);
    }
  };

  const points = wallet?.ridePoints ?? user?.ridePoints ?? 0;
  const priceKobo = wallet?.ridePriceKobo ?? 25000;
  const leftoverKobo = wallet?.leftoverKobo ?? 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      <AppHeader title="Fund" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <Card style={styles.card}>
          <Text style={styles.cardEyebrow}>BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceNumber}>{points}</Text>
            <Text style={styles.balanceUnit}>PTS</Text>
          </View>
          <Text style={styles.balanceRate}>
            ₦{(priceKobo / 100).toFixed(0)} = 1 point
            {leftoverKobo > 0 ? ` · leftover ₦${(leftoverKobo / 100).toFixed(0)}` : ""}
          </Text>
        </Card>

        {/* Pay Online Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Pay online</Text>
          <Text style={styles.cardSubtitle}>
            Pay by card, bank transfer, or any payment method available in Paystack.
          </Text>

          <Field
            label="Amount (₦)"
            keyboardType="numeric"
            placeholder="250"
            value={amountNaira}
            onChangeText={setAmountNaira}
          />

          <ErrorText>{paymentError}</ErrorText>

          <PrimaryButton
            onPress={startPayment}
            loading={isStartingPayment}
            disabled={isStartingPayment}
            style={styles.paystackBtn}
          >
            {isStartingPayment ? "Opening Paystack…" : "Continue to Paystack"}
          </PrimaryButton>

          <Text style={styles.disclaimerText}>
            Your points are added only after Paystack sends a successful-payment webhook.
          </Text>
        </Card>

        {/* Dedicated Account Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Paystack account</Text>
          <Text style={styles.cardSubtitle}>
            Transfer from any bank app. Points land after Paystack confirms the credit.
          </Text>

          {[
            { label: "BANK", value: acct?.bankName || "Not issued yet", copyable: false },
            {
              label: "ACCOUNT NUMBER",
              value: acct?.accountNumber || "—",
              copyable: !!acct?.accountNumber,
              key: "nuban",
            },
            { label: "ACCOUNT NAME", value: acct?.accountName || "—", copyable: false },
          ].map((item) => (
            <View key={item.label} style={styles.accountItemRow}>
              <View style={styles.accountTextCol}>
                <Text style={styles.accountLabel}>{item.label}</Text>
                <Text style={styles.accountValue}>{item.value}</Text>
              </View>
              {item.copyable ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => copy(item.value, item.key)}
                  style={styles.copyAccountBtn}
                >
                  <CopyIcon size={16} color={theme.colors.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          {copiedKey === "nuban" ? (
            <Text style={styles.copiedSuccessText}>Account number copied</Text>
          ) : null}

          {!acct?.accountNumber ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                No dedicated account yet (Paystack test keys often skip this). Ask an admin to add
                points for the demo.
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            variant="outline"
            onPress={onRefresh}
            style={styles.refreshBalanceBtn}
          >
            Refresh balance
          </PrimaryButton>
        </Card>
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
  cardEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: theme.colors.mutedLight,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  balanceNumber: {
    fontSize: 36,
    fontWeight: "900",
    color: theme.colors.textPrimary,
  },
  balanceUnit: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.muted,
    marginLeft: 6,
  },
  balanceRate: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 6,
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
    marginBottom: 14,
    lineHeight: 18,
  },
  paystackBtn: {
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    marginTop: 10,
    lineHeight: 16,
  },
  accountItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.cardHover,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  accountTextCol: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: theme.colors.mutedLight,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  copyAccountBtn: {
    padding: 6,
  },
  copiedSuccessText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.greenText,
    marginTop: 4,
  },
  warningBox: {
    backgroundColor: theme.colors.amberBg,
    borderColor: theme.colors.amberBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  warningText: {
    fontSize: 12,
    color: theme.colors.amberText,
    lineHeight: 17,
  },
  refreshBalanceBtn: {
    marginTop: 14,
  },
});
