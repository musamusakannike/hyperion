"use client";

import { useEffect, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { RideRow } from "@/components/ride-row";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";

function Inner() {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    api.get<{ trips: Trip[] }>("/api/admin/trips").then(({ data }) => setTrips(data.trips ?? []));
  }, []);
  return (
    <AppShell tabs={adminTabs} title="Trips">
      <div className="col-span-12">
        <Card className="divide-y divide-zinc-800/60">
          {trips.length === 0 ? (
            <p className="p-8 text-center text-zinc-400">No trips yet.</p>
          ) : (
            trips.map((trip, i) => <RideRow key={trip._id} trip={trip} index={i} perspective="admin" />)
          )}
        </Card>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Guard roles={["admin"]}>
      <Inner />
    </Guard>
  );
}
