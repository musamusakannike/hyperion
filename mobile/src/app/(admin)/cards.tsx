import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, CopyButton, ErrorText, Field, PageIntro, PrimaryButton, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { theme } from "@/theme";
import { successHaptic } from "@/lib/haptics";

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const [students, setStudents] = useState<User[]>([]);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkUid, setLinkUid] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get<{ users: User[] }>("/api/admin/users");
    setStudents((data.users ?? []).filter((u) => u.role === "student"));
  }, []);

  useEffect(() => {
    load().catch((err) => setError(apiError(err)));
  }, [load]);

  const selected = students.find((s) => (s.id || (s as User & { _id?: string })._id) === linkStudentId);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Cards" />
      <ScrollView contentContainerStyle={styles.content}>
        <PageIntro title="Link a bus card" subtitle="Copy the number from the reader, pick a student, save." />
        <Card>
          <Text style={styles.label}>Student</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {students.map((s) => {
              const id = s.id || (s as User & { _id?: string })._id || "";
              const active = linkStudentId === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setLinkStudentId(id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.fullName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {selected?.rfidUid ? (
            <View style={styles.bound}>
              <Text style={styles.boundText}>Current card {selected.rfidUid}</Text>
              <CopyButton value={selected.rfidUid} />
            </View>
          ) : null}
          <Field label="Card number" placeholder="01020304" autoCapitalize="characters" value={linkUid} onChangeText={setLinkUid} />
          <ErrorText>{error}</ErrorText>
          <SuccessText>{ok}</SuccessText>
          <PrimaryButton
            loading={busy}
            onPress={async () => {
              if (!linkStudentId || !linkUid.trim()) {
                setError("Pick a student and type the card number.");
                return;
              }
              setBusy(true);
              setError("");
              try {
                await api.post(`/api/admin/students/${linkStudentId}/rfid`, { rfidUid: linkUid.trim() });
                setOk("Card linked");
                setLinkUid("");
                await successHaptic();
                await load();
              } catch (err) {
                setError(apiError(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            Save card
          </PrimaryButton>
          {selected?.rfidUid ? (
            <PrimaryButton
              variant="danger"
              style={{ marginTop: 10 }}
              onPress={async () => {
                await api.delete(`/api/admin/students/${linkStudentId}/rfid`);
                setOk("Card unlinked");
                await load();
              }}
            >
              Unlink card
            </PrimaryButton>
          ) : null}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 16, gap: 12 },
  label: { fontSize: 13, fontWeight: "800", marginBottom: 6, color: theme.colors.textSecondary },
  chip: {
    backgroundColor: theme.colors.cardHover,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipActive: { backgroundColor: theme.colors.accent },
  chipText: { fontWeight: "700", color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.white },
  bound: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  boundText: { fontWeight: "700", color: theme.colors.greenText },
});
