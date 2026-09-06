import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { theme } from "@/theme";

export default function AdminHomeScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get<AdminStats>("/api/admin/stats");
      setStats(data);
    } catch {
      // ignore
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const tiles = [
    { label: "STUDENTS", value: stats?.students ?? "—" },
    { label: "DRIVERS", value: stats?.drivers ?? "—" },
    { label: "RIDES TODAY", value: stats?.ridesToday ?? "—" },
    { label: "SUCCESSFUL RIDES", value: stats?.successfulRides ?? "—" },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Admin" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stat Tiles Grid */}
        <View style={styles.grid}>
          {tiles.map((tile) => (
            <Card key={tile.label} style={styles.tileCard}>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileValue}>{tile.value}</Text>
            </Card>
          ))}
        </View>

        {/* Exhibition Booth Card */}
        <View style={styles.boothCard}>
          <Text style={styles.boothTitle}>Exhibition booth</Text>
          <Text style={styles.boothText}>
            Seed a student with points, open the student QR on one phone, and scan it from the
            driver account on another.
          </Text>
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
    paddingBottom: 32,
    gap: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tileCard: {
    width: "48%",
    padding: 18,
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: theme.colors.mutedLight,
  },
  tileValue: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.colors.textPrimary,
    marginTop: 6,
  },
  boothCard: {
    backgroundColor: theme.colors.banner,
    borderColor: theme.colors.bannerBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginTop: 4,
  },
  boothTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.bannerText,
  },
  boothText: {
    fontSize: 13,
    color: "#1e40af",
    marginTop: 6,
    lineHeight: 18,
  },
});
