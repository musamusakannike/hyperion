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
import { RideRow } from "@/components/ride-row";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";
import { theme } from "@/theme";

export default function StudentRidesScreen() {
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
    await loadTrips();
    setRefreshing(false);
  }, [loadTrips]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Rides" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.card}>
          {trips.length === 0 ? (
            <Text style={styles.emptyText}>No rides yet.</Text>
          ) : (
            trips.map((trip, i) => <RideRow key={trip._id} trip={trip} index={i} perspective="student" />)
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
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    padding: 0,
    overflow: "hidden",
  },
  emptyText: {
    padding: 32,
    textAlign: "center",
    fontSize: 14,
    color: theme.colors.mutedLight,
  },
});
