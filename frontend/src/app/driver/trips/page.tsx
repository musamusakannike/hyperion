"use client";

import { useEffect, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, driverTabs } from "@/components/shell";
import { RideRow } from "@/components/ride-row";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";

function Inner() {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    api.get<{ trips: Trip[] }>("/api/scans/trips").then(({ data }) => setTrips(data.trips ?? []));
  }, []);
  return (
    <AppShell tabs={driverTabs} title="My trips">
      <div className="col-span-12">
        <Card className="divide-y divide-slate-100">
          {trips.length === 0 ? (
            <p className="p-8 text-center text-slate-400">No scans yet.</p>
          ) : (
            trips.map((trip, i) => <RideRow key={trip._id} trip={trip} index={i} perspective="driver" />)
          )}
        </Card>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Guard roles={["driver"]}>
      <Inner />
    </Guard>
  );
}
