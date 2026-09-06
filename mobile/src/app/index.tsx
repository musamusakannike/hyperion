import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, homeFor } from "@/lib/auth-context";
import { Avatar } from "@/components/ui";
import { theme } from "@/theme";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/(auth)/login" as any);
    } else {
      router.replace(homeFor(user.role) as any);
    }
  }, [user, loading, router]);

  return (
    <View style={styles.container}>
      <Avatar name="H" size="lg" />
      <Text style={styles.title}>HYPERION</Text>
      <Text style={styles.subtitle}>Ride points & smart shuttle system</Text>
      <ActivityIndicator size="small" color={theme.colors.accent} style={styles.spinner} />
      <Text style={styles.status}>Opening Hyperion…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: theme.colors.accent,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 6,
  },
  spinner: {
    marginTop: 28,
  },
  status: {
    fontSize: 13,
    color: theme.colors.mutedLight,
    marginTop: 10,
  },
});
