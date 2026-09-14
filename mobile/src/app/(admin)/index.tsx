import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, PageIntro } from "@/components/ui";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { theme } from "@/theme";
import { tap } from "@/lib/haptics";

export default function AdminHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const tiles = [
    { label: "Students", value: stats?.students ?? "—" },
    { label: "Drivers", value: stats?.drivers ?? "—" },
    { label: "Rides today", value: stats?.ridesToday ?? "—" },
    { label: "Good rides", value: stats?.successfulRides ?? "—" },
  ];

  const actions = [
    { href: "/(admin)/people", label: "See people", hint: "Search and add points" },
    { href: "/(admin)/students", label: "Add student", hint: "New rider" },
    { href: "/(admin)/drivers", label: "Add driver", hint: "New scanner" },
    { href: "/(admin)/cards", label: "Link a card", hint: "RFID to student" },
    { href: "/(admin)/devices", label: "Bus keys", hint: "Scanner password" },
    { href: "/(admin)/trips", label: "Ride log", hint: "Who boarded" },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Admin" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadStats();
              setRefreshing(false);
            }}
          />
        }
      >
        <PageIntro title="Admin home" subtitle="Pick one job. Each screen does one thing." />
        <View style={styles.grid}>
          {tiles.map((tile) => (
            <Card key={tile.label} style={styles.tileCard}>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileValue}>{tile.value}</Text>
            </Card>
          ))}
        </View>
        {actions.map((item) => (
          <TouchableOpacity
            key={item.href}
            style={styles.action}
            onPress={() => {
              void tap();
              router.push(item.href as never);
            }}
          >
            <Text style={styles.actionTitle}>{item.label}</Text>
            <Text style={styles.actionHint}>{item.hint}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.boothCard}>
          <Text style={styles.boothTitle}>Quick demo</Text>
          <Text style={styles.boothText}>
            Give a student points. Open their QR on one phone. Scan it as a driver on another.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tileCard: { width: "48%", padding: 16 },
  tileLabel: { fontSize: 11, fontWeight: "800", color: theme.colors.accent },
  tileValue: { fontSize: 28, fontWeight: "900", color: theme.colors.textPrimary, marginTop: 4 },
  action: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 14,
  },
  actionTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.textPrimary },
  actionHint: { fontSize: 12, fontWeight: "600", color: theme.colors.muted, marginTop: 2 },
  boothCard: {
    backgroundColor: theme.colors.banner,
    borderRadius: 20,
    padding: 16,
  },
  boothTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.bannerText },
  boothText: { fontSize: 13, fontWeight: "600", color: "#1e40af", marginTop: 6, lineHeight: 18 },
});
