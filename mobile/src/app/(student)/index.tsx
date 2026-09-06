import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card } from "@/components/ui";
import { BusIcon, CopyIcon, FundIcon, ProfileIcon, StarIcon } from "@/components/icons";
import { RideRow } from "@/components/ride-row";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";
import { theme } from "@/theme";

export default function StudentHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updated, setUpdated] = useState("just now");

  const loadTrips = useCallback(async () => {
    try {
      const { data } = await api.get<{ trips: Trip[] }>("/api/me/trips");
      setTrips(data.trips ?? []);
    } catch {
      // ignore
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadTrips()]);
    setRefreshing(false);
  }, [refresh, loadTrips]);

  useEffect(() => {
    loadTrips();
    const t0 = Date.now();
    const id = setInterval(() => {
      const s = Math.round((Date.now() - t0) / 1000);
      setUpdated(s < 5 ? "just now" : `${s} sec ago`);
    }, 1000);
    return () => clearInterval(id);
  }, [loadTrips]);

  const copyAccount = async () => {
    const acct = user?.dedicatedAccount?.accountNumber;
    if (!acct) return;
    await Clipboard.setStringAsync(acct);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const account = user?.dedicatedAccount?.accountNumber || "Pending account";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Student" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Points Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroEyebrowRow}>
            <StarIcon size={16} color={theme.colors.accent} />
            <Text style={styles.heroEyebrow}>Ride Points · {account}</Text>
            {user?.dedicatedAccount?.accountNumber ? (
              <TouchableOpacity activeOpacity={0.7} onPress={copyAccount} style={styles.copyBtn}>
                <CopyIcon size={14} color={theme.colors.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
          {copied ? <Text style={styles.copiedText}>Account copied to clipboard</Text> : null}

          <View style={styles.pointsRow}>
            <Text style={styles.pointsNumber}>{(user?.ridePoints ?? 0).toLocaleString()}</Text>
            <Text style={styles.pointsUnit}>PTS</Text>
          </View>

          <Text style={styles.updatedText}>Last updated {updated}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(student)/qr" as any)}
              style={styles.quickActionItem}
            >
              <View style={styles.quickIconBox}>
                <BusIcon size={32} color={theme.colors.accent} />
              </View>
              <Text style={styles.quickLabel}>RIDE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(student)/fund" as any)}
              style={styles.quickActionItem}
            >
              <View style={styles.quickIconBox}>
                <FundIcon size={32} color={theme.colors.accent} />
              </View>
              <Text style={styles.quickLabel}>FUND</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(student)/profile" as any)}
              style={styles.quickActionItem}
            >
              <View style={styles.quickIconBox}>
                <ProfileIcon size={32} color={theme.colors.accent} />
              </View>
              <Text style={styles.quickLabel}>PROFILE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promo Card */}
        <View style={styles.promoCard}>
          <View style={styles.promoIconBox}>
            <BusIcon size={26} color={theme.colors.accent} />
          </View>
          <View style={styles.promoTextCol}>
            <Text style={styles.promoHeading}>Ride more. Save more. 😎</Text>
            <Text style={styles.promoDescription}>
              Transfer ₦250 to your Hyperion account to earn one ride point.
            </Text>
          </View>
        </View>

        {/* Past Rides Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithDot}>
              <Text style={styles.sectionTitle}>Past Rides</Text>
              <View style={styles.blueDot} />
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(student)/rides" as any)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.ridesCard}>
            {trips.length === 0 ? (
              <Text style={styles.emptyRidesText}>No rides yet. Show your QR at the gate.</Text>
            ) : (
              trips
                .slice(0, 6)
                .map((trip, i) => <RideRow key={trip._id} trip={trip} index={i} perspective="student" />)
            )}
          </Card>
        </View>
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
    padding: 16,
    paddingBottom: 24,
  },
  heroCard: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: theme.colors.bg,
  },
  heroEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  copyBtn: {
    padding: 4,
  },
  copiedText: {
    fontSize: 12,
    color: theme.colors.greenText,
    marginTop: 4,
    fontWeight: "600",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  pointsNumber: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1,
    color: theme.colors.textPrimary,
  },
  pointsUnit: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.muted,
    marginLeft: 6,
  },
  updatedText: {
    fontSize: 12,
    color: theme.colors.mutedLight,
    marginTop: 6,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  sectionTitleWithDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  quickActionItem: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quickIconBox: {
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: theme.colors.textSecondary,
  },
  promoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.banner,
    borderColor: theme.colors.bannerBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginTop: 20,
  },
  promoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  promoTextCol: {
    flex: 1,
  },
  promoHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.bannerText,
  },
  promoDescription: {
    fontSize: 12,
    color: "#1e40af",
    marginTop: 2,
    lineHeight: 16,
  },
  ridesCard: {
    padding: 0,
    overflow: "hidden",
  },
  emptyRidesText: {
    padding: 24,
    textAlign: "center",
    fontSize: 13,
    color: theme.colors.mutedLight,
  },
});
