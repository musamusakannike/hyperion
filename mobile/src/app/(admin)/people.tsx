import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, ErrorText, Field, PrimaryButton } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { theme } from "@/theme";

export default function AdminPeopleScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyStudent, setBusyStudent] = useState(false);
  const [busyDriver, setBusyDriver] = useState(false);

  const [studentForm, setStudentForm] = useState({
    fullName: "",
    email: "",
    matricNumber: "",
    password: "StudentPass1!",
    pin: "1234",
  });

  const [driverForm, setDriverForm] = useState({
    fullName: "",
    email: "",
    password: "DriverPass1!",
  });

  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});
  const [rfidInput, setRfidInput] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkUid, setLinkUid] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const { data } = await api.get<{ users: User[] }>("/api/admin/users");
      setUsers(data.users ?? []);
    } catch (err) {
      setError(apiError(err, "Failed to load directory"));
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, [loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const createStudent = async () => {
    if (!studentForm.fullName || !studentForm.email || !studentForm.matricNumber) {
      setError("Please provide student name, email, and matric number");
      return;
    }
    setBusyStudent(true);
    setError("");
    try {
      await api.post("/api/admin/students", studentForm);
      setStudentForm({
        fullName: "",
        email: "",
        matricNumber: "",
        password: "StudentPass1!",
        pin: "1234",
      });
      await loadUsers();
    } catch (err) {
      setError(apiError(err, "Could not create student"));
    } finally {
      setBusyStudent(false);
    }
  };

  const createDriver = async () => {
    if (!driverForm.fullName || !driverForm.email) {
      setError("Please provide driver name and email");
      return;
    }
    setBusyDriver(true);
    setError("");
    try {
      await api.post("/api/admin/drivers", driverForm);
      setDriverForm({
        fullName: "",
        email: "",
        password: "DriverPass1!",
      });
      await loadUsers();
    } catch (err) {
      setError(apiError(err, "Could not create driver"));
    } finally {
      setBusyDriver(false);
    }
  };

  const addPoints = async (id: string) => {
    const delta = Number(pointsInput[id] || 0);
    if (!delta) return;

    setActionLoading((prev) => ({ ...prev, [`pts-${id}`]: true }));
    try {
      await api.post(`/api/admin/students/${id}/points`, {
        deltaPoints: delta,
        note: "admin top-up",
      });
      setPointsInput((prev) => ({ ...prev, [id]: "" }));
      await loadUsers();
    } catch (err) {
      setError(apiError(err, "Could not update points"));
    } finally {
      setActionLoading((prev) => ({ ...prev, [`pts-${id}`]: false }));
    }
  };

  const bindRfid = async (id: string, uid?: string) => {
    const rfid = (uid ?? rfidInput[id] ?? "").trim();
    if (!rfid) {
      setError("Enter the RFID UID from the bus pod serial log");
      return;
    }

    setActionLoading((prev) => ({ ...prev, [`rfid-${id}`]: true }));
    setError("");
    setOkMsg("");
    try {
      await api.post(`/api/admin/students/${id}/rfid`, { rfidUid: rfid });
      setRfidInput((prev) => ({ ...prev, [id]: "" }));
      setLinkUid("");
      setOkMsg("RFID card linked");
      await loadUsers();
    } catch (err) {
      setError(apiError(err, "Could not bind RFID"));
    } finally {
      setActionLoading((prev) => ({ ...prev, [`rfid-${id}`]: false }));
    }
  };

  const unbindRfid = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [`rfid-${id}`]: true }));
    try {
      await api.delete(`/api/admin/students/${id}/rfid`);
      setOkMsg("RFID unbound");
      await loadUsers();
    } catch (err) {
      setError(apiError(err, "Could not unbind RFID"));
    } finally {
      setActionLoading((prev) => ({ ...prev, [`rfid-${id}`]: false }));
    }
  };

  const students = users.filter((u) => u.role === "student");
  const visibleUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.fullName, u.email, u.matricNumber, u.rfidUid]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });
  const linkStudent = students.find((s) => (s.id || (s as User & { _id?: string })._id) === linkStudentId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      <AppHeader title="People" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <ErrorText>{error}</ErrorText>
        {okMsg ? <Text style={styles.okBanner}>{okMsg}</Text> : null}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Link RFID card</Text>
          <Text style={styles.hint}>
            Copy the UID from the ESP32 serial log (e.g. 01020304), choose the student, then bind.
          </Text>
          <Text style={styles.pickerLabel}>Student</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {students.map((s) => {
              const id = s.id || (s as User & { _id?: string })._id || "";
              const active = linkStudentId === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setLinkStudentId(id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                    {s.fullName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {linkStudent?.rfidUid ? (
            <Text style={styles.boundNote}>Currently bound: {linkStudent.rfidUid}</Text>
          ) : null}
          <Field
            label="RFID UID"
            placeholder="01020304"
            autoCapitalize="characters"
            value={linkUid}
            onChangeText={setLinkUid}
          />
          <PrimaryButton
            onPress={() => linkStudentId && bindRfid(linkStudentId, linkUid)}
            loading={!!actionLoading[`rfid-${linkStudentId}`]}
            disabled={!linkStudentId || actionLoading[`rfid-${linkStudentId}`]}
          >
            Bind card to student
          </PrimaryButton>
          {linkStudent?.rfidUid ? (
            <TouchableOpacity style={styles.unbindBtn} onPress={() => unbindRfid(linkStudentId)}>
              <Text style={styles.unbindBtnText}>Unbind card</Text>
            </TouchableOpacity>
          ) : null}
        </Card>

        {/* Create Student Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>New student</Text>
          <Field
            label="Name"
            placeholder="Full name"
            value={studentForm.fullName}
            onChangeText={(v) => setStudentForm((p) => ({ ...p, fullName: v }))}
          />
          <Field
            label="Email"
            placeholder="student@uni.edu.ng"
            keyboardType="email-address"
            autoCapitalize="none"
            value={studentForm.email}
            onChangeText={(v) => setStudentForm((p) => ({ ...p, email: v }))}
          />
          <Field
            label="Matric"
            placeholder="Matric number"
            autoCapitalize="characters"
            value={studentForm.matricNumber}
            onChangeText={(v) => setStudentForm((p) => ({ ...p, matricNumber: v }))}
          />
          <Field
            label="PIN"
            placeholder="1234"
            keyboardType="numeric"
            value={studentForm.pin}
            onChangeText={(v) => setStudentForm((p) => ({ ...p, pin: v }))}
          />
          <PrimaryButton onPress={createStudent} loading={busyStudent} disabled={busyStudent}>
            Create student
          </PrimaryButton>
        </Card>

        {/* Create Driver Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>New driver</Text>
          <Field
            label="Name"
            placeholder="Driver full name"
            value={driverForm.fullName}
            onChangeText={(v) => setDriverForm((p) => ({ ...p, fullName: v }))}
          />
          <Field
            label="Email"
            placeholder="driver@hyperion.ng"
            keyboardType="email-address"
            autoCapitalize="none"
            value={driverForm.email}
            onChangeText={(v) => setDriverForm((p) => ({ ...p, email: v }))}
          />
          <PrimaryButton onPress={createDriver} loading={busyDriver} disabled={busyDriver}>
            Create driver
          </PrimaryButton>
        </Card>

        {/* Users List */}
        <TextInput
          style={styles.search}
          placeholder="Search name, matric, RFID…"
          placeholderTextColor={theme.colors.mutedLight}
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.listHeading}>User Directory ({visibleUsers.length})</Text>

        <View style={styles.usersList}>
          {visibleUsers.map((u) => {
            const id = u.id || (u as User & { _id?: string })._id || "";
            const isStudent = u.role === "student";

            return (
              <Card key={id} style={styles.userCard}>
                <View style={styles.userHeaderRow}>
                  <View style={styles.userInfoCol}>
                    <Text style={styles.userFullName}>{u.fullName}</Text>
                    <Text style={styles.userEmailText}>{u.email}</Text>
                  </View>
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>{u.role.toUpperCase()}</Text>
                  </View>
                </View>

                {isStudent ? (
                  <View style={styles.studentDetails}>
                    <View style={styles.pointsBadgeRow}>
                      <Text style={styles.pointsLabel}>Balance:</Text>
                      <Text style={styles.pointsValue}>{u.ridePoints ?? 0} PTS</Text>
                      {u.rfidUid || u.hasRfid ? (
                        <Text style={styles.rfidBoundBadge}>{u.rfidUid || "RFID"}</Text>
                      ) : null}
                    </View>

                    {/* Top up Points */}
                    <View style={styles.inlineActionRow}>
                      <TextInput
                        style={styles.inlineInput}
                        placeholder="+pts"
                        placeholderTextColor={theme.colors.mutedLight}
                        keyboardType="numeric"
                        value={pointsInput[id] ?? ""}
                        onChangeText={(t) => setPointsInput((p) => ({ ...p, [id]: t }))}
                      />
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => addPoints(id)}
                        disabled={actionLoading[`pts-${id}`]}
                        style={styles.inlineActionBtn}
                      >
                        <Text style={styles.inlineActionBtnText}>
                          {actionLoading[`pts-${id}`] ? "…" : "Add"}
                        </Text>
                      </TouchableOpacity>

                      {/* Bind RFID */}
                      <TextInput
                        style={[styles.inlineInput, { flex: 1.4 }]}
                        placeholder="RFID UID"
                        placeholderTextColor={theme.colors.mutedLight}
                        autoCapitalize="characters"
                        value={rfidInput[id] ?? u.rfidUid ?? ""}
                        onChangeText={(t) => setRfidInput((p) => ({ ...p, [id]: t }))}
                      />
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => bindRfid(id)}
                        disabled={actionLoading[`rfid-${id}`]}
                        style={[styles.inlineActionBtn, styles.inlineActionBtnOutline]}
                      >
                        <Text
                          style={[
                            styles.inlineActionBtnText,
                            styles.inlineActionBtnOutlineText,
                          ]}
                        >
                          {actionLoading[`rfid-${id}`] ? "…" : "Bind"}
                        </Text>
                      </TouchableOpacity>
                      {u.rfidUid ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => unbindRfid(id)}
                          style={[styles.inlineActionBtn, styles.inlineActionBtnDanger]}
                        >
                          <Text style={styles.inlineActionBtnDangerText}>×</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
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
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    padding: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 10,
    marginTop: -6,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  chipScroll: {
    marginBottom: 10,
    maxHeight: 40,
  },
  chip: {
    backgroundColor: theme.colors.cardHover,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  boundNote: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.greenText,
    marginBottom: 8,
  },
  unbindBtn: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  unbindBtnText: {
    color: theme.colors.danger ?? "#b91c1c",
    fontWeight: "700",
    fontSize: 13,
  },
  okBanner: {
    backgroundColor: theme.colors.greenBg,
    color: theme.colors.greenText,
    padding: 10,
    borderRadius: 12,
    overflow: "hidden",
    fontSize: 13,
    fontWeight: "600",
  },
  search: {
    backgroundColor: theme.colors.cardHover,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  listHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    padding: 16,
  },
  userHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  userInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  userFullName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  userEmailText: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  rolePill: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.bannerBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  studentDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  pointsBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  pointsLabel: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  rfidBoundBadge: {
    fontSize: 10,
    fontWeight: "700",
    backgroundColor: theme.colors.greenBg,
    color: theme.colors.greenText,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
    marginLeft: 6,
  },
  inlineActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineInput: {
    flex: 1,
    backgroundColor: theme.colors.cardHover,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  inlineActionBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineActionBtnText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  inlineActionBtnOutline: {
    backgroundColor: theme.colors.cardHover,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  inlineActionBtnOutlineText: {
    color: theme.colors.textSecondary,
  },
  inlineActionBtnDanger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
  },
  inlineActionBtnDangerText: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "800",
  },
});
