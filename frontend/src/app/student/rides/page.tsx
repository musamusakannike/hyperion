"use client";

import { useEffect, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { RideRow } from "@/components/ride-row";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";

function RidesInner() {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    api.get<{ trips: Trip[] }>("/api/me/trips").then(({ data }) => setTrips(data.trips ?? []));
  }, []);
  return (
    <AppShell tabs={studentTabs} title="Rides">
      <div className="col-span-12">
        <Card className="divide-y divide-zinc-800/60">
          {trips.length === 0 ? (
            <p className="p-8 text-center text-zinc-400">No rides yet.</p>
          ) : (
            trips.map((trip, i) => <RideRow key={trip._id} trip={trip} index={i} perspective="student" />)
          )}
        </Card>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Guard roles={["student"]}>
      <RidesInner />
    </Guard>
  );
}
