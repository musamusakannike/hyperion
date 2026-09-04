"use client";

import { FiTruck } from "react-icons/fi";
import type { Trip } from "@/lib/types";
import { StatusBadge } from "./ui";

const colors = ["bg-purple-600/90", "bg-amber-500", "bg-sky-600"];

function nameOf(ref: Trip["studentId"] | Trip["driverId"]): string {
  if (typeof ref === "object" && ref && "fullName" in ref) return ref.fullName ?? "Rider";
  return "Ride";
}

export function RideRow({ trip, index = 0, perspective }: { trip: Trip; index?: number; perspective: "student" | "driver" | "admin" }) {
  const when = new Date(trip.createdAt);
  const title =
    perspective === "driver"
      ? nameOf(trip.studentId)
      : perspective === "admin"
        ? `${nameOf(trip.studentId)} · ${nameOf(trip.driverId)}`
        : "Campus shuttle";
  const subtitle = `${trip.method.toUpperCase()} · ${trip.farePoints} pt`;

  return (
    <article className="flex items-center justify-between p-3.5 transition hover:bg-card">
      <div className="flex items-center space-x-3">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white ${colors[index % colors.length]}`}
        >
          <FiTruck className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-tight text-white">{title}</h4>
          <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            {when.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
            {when.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end text-right">
        <span className={`text-sm font-semibold ${trip.status === "success" ? "text-app-red" : "text-zinc-400"}`}>
          {trip.status === "success" ? `-${trip.farePoints} PTS` : "—"}
        </span>
        <StatusBadge ok={trip.status === "success"} label={trip.status === "success" ? "Completed" : trip.failReason ?? "Failed"} />
      </div>
    </article>
  );
}
