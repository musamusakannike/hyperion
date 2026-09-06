"use client";

import { useEffect, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/types";

function Inner() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => {
    api.get<AdminStats>("/api/admin/stats").then(({ data }) => setStats(data));
  }, []);
  const tiles = [
    ["Students", stats?.students ?? "—"],
    ["Drivers", stats?.drivers ?? "—"],
    ["Rides today", stats?.ridesToday ?? "—"],
    ["All successful rides", stats?.successfulRides ?? "—"],
  ];
  return (
    <AppShell tabs={adminTabs} title="Admin">
      <div className="col-span-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>
      <div className="col-span-12 mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-blue-950 shadow-sm">
        <h3 className="font-bold text-blue-900">Exhibition booth</h3>
        <p className="mt-1 text-sm text-blue-800/80">
          Seed a student with points, open the student QR on one phone, scan it from the driver account on another.
        </p>
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
