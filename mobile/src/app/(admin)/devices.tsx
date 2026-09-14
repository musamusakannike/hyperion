import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader, Card, CopyButton, ErrorText, Field, PageIntro, PrimaryButton, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { theme } from "@/theme";
import { successHaptic } from "@/lib/haptics";

type DeviceRow = {
  _id?: string;
  id?: string;
  deviceLabel: string;
  apiKeyPrefix: string;
  driverId: string | { fullName?: string };
};

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [driverId, setDriverId] = useState("");
  const [label, setLabel] = useState("Bus scanner");
  const [issuedKey, setIssuedKey] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    const [{ data: usersData }, { data: deviceData }] = await Promise.all([
      api.get<{ users: User[] }>("/api/admin/users"),
      api.get<{ devices: DeviceRow[] }>("/api/admin/devices").catch(() => ({ data: { devices: [] } })),
    ]);
    setDrivers((usersData.users ?? []).filter((u) => u.role === "driver"));
    setDevices(deviceData.devices ?? []);
  }, []);

  useEffect(() => {
    load().catch((err) => setError(apiError(err)));
  }, [load]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Bus keys" />
      <ScrollView contentContainerStyle={styles.content}>
        <PageIntro title="Scanner keys" subtitle="Each hardware scanner needs a secret key." />
        <Card>
          <Text style={styles.label}>Which driver?</Text>
          <ScrollView horizontal style={{ marginBottom: 12 }}>
            {drivers.map((d) => {
              const id = d.id || (d as User & { _id?: string })._id || "";
              const active = driverId === id;
              return (
                <TouchableOpacity key={id} onPress={() => setDriverId(id)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.fullName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Field label="Name this scanner" value={label} onChangeText={setLabel} />
          <ErrorText>{error}</ErrorText>
          <SuccessText>{ok}</SuccessText>
          {issuedKey ? (
            <View style={styles.keyBox}>
              <Text selectable style={styles.keyText}>
                {issuedKey}
              </Text>
              <CopyButton value={issuedKey} label="Copy key" />
            </View>
          ) : null}
          <PrimaryButton
            onPress={async () => {
              setError("");
              setIssuedKey("");
              try {
                const { data } = await api.post<{ apiKey: string }>("/api/admin/devices", {
                  driverId,
                  deviceLabel: label,
                });
                setIssuedKey(data.apiKey);
                setOk("Copy this key now. You will not see it again.");
                await successHaptic();
                await load();
              } catch (err) {
                setError(apiError(err));
              }
            }}
          >
            Make a new key
          </PrimaryButton>
        </Card>
        {devices.map((d) => (
          <Card key={d.id || d._id}>
            <Text style={styles.devTitle}>{d.deviceLabel}</Text>
            <Text style={styles.devMeta}>
              {d.apiKeyPrefix}… · {typeof d.driverId === "object" ? d.driverId.fullName : "driver"}
            </Text>
            <CopyButton value={d.apiKeyPrefix} label="Prefix" />
          </Card>
        ))}
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
  keyBox: { backgroundColor: "#0f172a", borderRadius: 16, padding: 12, marginBottom: 12, gap: 8 },
  keyText: { color: "#bef264", fontSize: 12, fontFamily: "Courier" },
  devTitle: { fontWeight: "800", fontSize: 15 },
  devMeta: { color: theme.colors.muted, fontWeight: "600", marginVertical: 6 },
});
