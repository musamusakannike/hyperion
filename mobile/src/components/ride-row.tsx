import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";
import type { Trip } from "@/lib/types";
import { TruckIcon } from "./icons";
import { StatusBadge } from "./ui";

function nameOf(ref: Trip["studentId"] | Trip["driverId"]): string {
  if (typeof ref === "object" && ref && "fullName" in ref) {
    return ref.fullName ?? "Rider";
  }
  return "Ride";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    const formattedHour = hours % 12 || 12;
    return `${day} ${month} ${year} · ${formattedHour}:${minutes} ${ampm}`;
  } catch {
    return iso;
  }
}

export function RideRow({
  trip,
  index = 0,
  perspective,
}: {
  trip: Trip;
  index?: number;
  perspective: "student" | "driver" | "admin";
}) {
  const isSuccess = trip.status === "success";
  const title =
    perspective === "driver"
      ? nameOf(trip.studentId)
      : perspective === "admin"
      ? `${nameOf(trip.studentId)} · ${nameOf(trip.driverId)}`
      : "Campus shuttle";

  const subtitle = `${trip.method.toUpperCase()} · ${trip.farePoints} pt`;
  const bgIconColor = theme.shuttleColors[index % theme.shuttleColors.length];

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <View style={[styles.iconBox, { backgroundColor: bgIconColor }]}>
          <TruckIcon size={18} color={theme.colors.white} />
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.timestamp}>{formatDate(trip.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.rightCol}>
        <Text style={[styles.pointsText, isSuccess ? styles.pointsDeducted : styles.pointsNeutral]}>
          {isSuccess ? `-${trip.farePoints} PTS` : "—"}
        </Text>
        <StatusBadge ok={isSuccess} label={isSuccess ? "Completed" : trip.failReason ?? "Failed"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  leftCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCol: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: theme.colors.mutedLight,
    marginTop: 2,
  },
  rightCol: {
    alignItems: "flex-end",
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "700",
  },
  pointsDeducted: {
    color: theme.colors.redText,
  },
  pointsNeutral: {
    color: theme.colors.mutedLight,
  },
});
