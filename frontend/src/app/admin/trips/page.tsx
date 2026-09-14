"use client";

import { useEffect, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { RideRow } from "@/components/ride-row";
import { Card, PageIntro } from "@/components/ui";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";

function Inner() {
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    api.get<{ trips: Trip[] }>("/api/admin/trips").then(({ data }) => setTrips(data.trips ?? []));
  }, []);
  return (
    <AppShell tabs={adminTabs} title="Rides">
      <div className="col-span-12">
        <PageIntro title="All rides" subtitle="Who boarded, who scanned, and if it worked." />
        <Card className="divide-y divide-slate-100">
          {trips.length === 0 ? (
            <p className="p-8 text-center font-bold text-slate-400">No rides yet.</p>
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
