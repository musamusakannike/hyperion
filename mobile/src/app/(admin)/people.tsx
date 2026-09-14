import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, CopyButton, ErrorText, PageIntro, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { theme } from "@/theme";
import { successHaptic } from "@/lib/haptics";

export default function AdminPeopleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const { data } = await api.get<{ users: User[] }>("/api/admin/users");
      setUsers(data.users ?? []);
    } catch (err) {
      setError(apiError(err, "Could not load people"));
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const visibleUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.fullName, u.email, u.matricNumber, u.rfidUid]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="People" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadUsers();
              setRefreshing(false);
            }}
          />
        }
      >
        <PageIntro title="People" subtitle="Find someone and give them ride points." />
        <View style={styles.links}>
          <TouchableOpacity style={styles.linkChip} onPress={() => router.push("/(admin)/students" as never)}>
            <Text style={styles.linkChipText}>+ Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkChip} onPress={() => router.push("/(admin)/drivers" as never)}>
            <Text style={styles.linkChipText}>+ Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkChip} onPress={() => router.push("/(admin)/cards" as never)}>
            <Text style={styles.linkChipText}>Link card</Text>
          </TouchableOpacity>
        </View>
        <ErrorText>{error}</ErrorText>
        <SuccessText>{okMsg}</SuccessText>
        <TextInput
          style={styles.search}
          placeholder="Search name, email, card…"
          placeholderTextColor={theme.colors.mutedLight}
          value={search}
          onChangeText={setSearch}
        />
        {visibleUsers.map((u) => {
          const id = u.id || (u as User & { _id?: string })._id || "";
          return (
            <Card key={id} style={styles.userCard}>
              <View style={styles.userHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userFullName}>{u.fullName}</Text>
                  <Text style={styles.userEmailText}>{u.email}</Text>
                </View>
                <CopyButton value={u.email} label="Email" />
              </View>
              <Text style={styles.role}>{u.role}</Text>
              {u.role === "student" ? (
                <View style={styles.studentDetails}>
                  <Text style={styles.pointsValue}>{u.ridePoints ?? 0} rides</Text>
                  {u.rfidUid ? (
                    <View style={styles.rfidRow}>
                      <Text style={styles.rfidBoundBadge}>{u.rfidUid}</Text>
                      <CopyButton value={u.rfidUid} />
                    </View>
                  ) : null}
                  <View style={styles.inlineActionRow}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="+5"
                      keyboardType="numeric"
                      value={pointsInput[id] ?? ""}
                      onChangeText={(t) => setPointsInput((p) => ({ ...p, [id]: t }))}
                    />
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={async () => {
                        try {
                          await api.post(`/api/admin/students/${id}/points`, {
                            deltaPoints: Number(pointsInput[id] || 0),
                            note: "admin top-up",
                          });
                          setPointsInput((p) => ({ ...p, [id]: "" }));
                          setOkMsg(`Added points for ${u.fullName}`);
                          await successHaptic();
                          await loadUsers();
                        } catch (err) {
                          setError(apiError(err));
                        }
                      }}
                    >
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  linkChip: { backgroundColor: theme.colors.accentSoft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  linkChipText: { color: theme.colors.accent, fontWeight: "800", fontSize: 12 },
  search: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  userCard: { padding: 16 },
  userHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  userFullName: { fontSize: 15, fontWeight: "800", color: theme.colors.textPrimary },
  userEmailText: { fontSize: 13, fontWeight: "600", color: theme.colors.muted, marginTop: 2 },
  role: { marginTop: 6, fontSize: 11, fontWeight: "800", color: theme.colors.accent, textTransform: "uppercase" },
  studentDetails: { marginTop: 10, gap: 8 },
  pointsValue: { fontSize: 16, fontWeight: "900" },
  rfidRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rfidBoundBadge: {
    fontSize: 11,
    fontWeight: "800",
    backgroundColor: theme.colors.greenBg,
    color: theme.colors.greenText,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  inlineActionRow: { flexDirection: "row", gap: 8 },
  inlineInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontWeight: "700",
  },
  addBtn: { backgroundColor: theme.colors.accent, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  addBtnText: { color: theme.colors.white, fontWeight: "800" },
});
