"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiStar } from "react-icons/fi";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { RideRow } from "@/components/ride-row";
import { Card, CopyButton } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Trip } from "@/lib/types";

function BusIcon({ className = "h-8 w-8 text-blue-600" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
    </svg>
  );
}

function StudentHome() {
  const { user, refresh } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const account = user?.dedicatedAccount?.accountNumber;

  useEffect(() => {
    refresh();
    api.get<{ trips: Trip[] }>("/api/me/trips").then(({ data }) => setTrips(data.trips ?? []));
  }, [refresh]);

  return (
    <AppShell tabs={studentTabs} title="Home">
      <div className="col-span-12 space-y-6 lg:col-span-7">
        <section className="flex flex-col items-center text-center animate-pop">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-600">
            <FiStar className="h-4 w-4 fill-current text-blue-600" />
            <span>Your ride points</span>
          </div>
          <h1 className="mt-2 flex items-baseline text-5xl font-black tracking-tight text-slate-900">
            {(user?.ridePoints ?? 0).toLocaleString()}
            <span className="ml-2 text-base font-extrabold text-slate-400">rides left</span>
          </h1>
          {account ? (
            <div className="mt-3 flex items-center gap-2">
              <p className="text-xs font-bold text-slate-400">Bank account {account}</p>
              <CopyButton value={account} label="Copy" />
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="mb-3 text-base font-black text-slate-900">Do this next</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/student/qr", label: "Scan QR", hint: "Board" },
              { href: "/student/fund", label: "Buy rides", hint: "₦250 each" },
              { href: "/student/profile", label: "My PIN", hint: "Keep safe" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex aspect-square flex-col items-center justify-center rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2"
              >
                <BusIcon className="mb-2 h-8 w-8 text-blue-600" />
                <span className="text-xs font-black text-slate-800">{item.label}</span>
                <span className="text-[10px] font-bold text-slate-400">{item.hint}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border-2 border-blue-100 bg-blue-50 p-4">
          <h3 className="font-black text-blue-900">How it works</h3>
          <p className="mt-1 text-sm font-semibold text-blue-800/80">
            1 point = 1 bus ride. Buy points, scan the driver’s QR, or tap your card.
          </p>
        </section>
      </div>

      <div className="col-span-12 lg:col-span-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">Recent rides</h2>
          <Link href="/student/rides" className="text-sm font-extrabold text-blue-600">
            See all
          </Link>
        </div>
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {trips.length === 0 ? (
            <p className="p-6 text-center text-sm font-bold text-slate-400">No rides yet. Scan the driver QR at the bus.</p>
          ) : (
            trips.slice(0, 5).map((trip, i) => <RideRow key={trip._id} trip={trip} index={i} perspective="student" />)
          )}
        </Card>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Guard roles={["student"]}>
      <StudentHome />
    </Guard>
  );
}
