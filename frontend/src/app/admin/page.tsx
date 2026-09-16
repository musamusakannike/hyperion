"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiCreditCard, FiKey, FiPlus, FiTruck, FiUsers } from "react-icons/fi";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { Card, PageIntro } from "@/components/ui";
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
    ["All good rides", stats?.successfulRides ?? "—"],
  ];
  const actions = [
    { href: "/admin/people", label: "See people", hint: "Search, add points", icon: FiUsers },
    { href: "/admin/students", label: "Add student", hint: "New rider account", icon: FiPlus },
    { href: "/admin/drivers", label: "Add driver", hint: "New boarding QR account", icon: FiTruck },
    { href: "/admin/cards", label: "Link a card", hint: "Match RFID to a student", icon: FiCreditCard },
    { href: "/admin/devices", label: "Bus keys", hint: "Give a scanner its password", icon: FiKey },
    { href: "/admin/trips", label: "Ride log", hint: "Who boarded today", icon: FiTruck },
  ];
  return (
    <AppShell tabs={adminTabs} title="Admin">
      <div className="col-span-12">
        <PageIntro title="Admin home" subtitle="Pick one job. Each page does one thing." />
      </div>
      <div className="col-span-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-blue-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          </Card>
        ))}
      </div>
      <div className="col-span-12 mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-4 transition hover:-translate-y-0.5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-black text-slate-900">{item.label}</p>
              <p className="text-xs font-bold text-slate-400">{item.hint}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="col-span-12 mt-4 rounded-3xl border-2 border-blue-100 bg-blue-50 p-5">
        <h3 className="font-black text-blue-900">Quick demo</h3>
        <p className="mt-1 text-sm font-semibold text-blue-800/80">
          Give a student some points. Open the driver QR on one phone. Scan it as a student on another phone.
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
