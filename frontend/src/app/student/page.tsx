"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiCopy, FiStar, FiTruck, FiCreditCard, FiUser } from "react-icons/fi";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { RideRow } from "@/components/ride-row";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Trip } from "@/lib/types";

function StudentHome() {
  const { user, refresh } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [updated, setUpdated] = useState("just now");
  const [copied, setCopied] = useState(false);
  const account = user?.dedicatedAccount?.accountNumber || "Pending account";

  useEffect(() => {
    refresh();
    api.get<{ trips: Trip[] }>("/api/me/trips").then(({ data }) => setTrips(data.trips ?? []));
    const t0 = Date.now();
    const id = setInterval(() => {
      const s = Math.round((Date.now() - t0) / 1000);
      setUpdated(s < 5 ? "just now" : `${s} sec ago`);
    }, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const copy = async () => {
    if (!user?.dedicatedAccount?.accountNumber) return;
    await navigator.clipboard.writeText(user.dedicatedAccount.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppShell tabs={studentTabs} title="Student">
      <div className="col-span-12 space-y-6 lg:col-span-7">
        <section className="flex flex-col items-center text-center">
          <div className="flex items-center space-x-1.5 text-sm font-medium text-slate-600">
            <FiStar className="h-4 w-4 fill-current text-blue-600" />
            <span>Ride Points · {account}</span>
            <button type="button" aria-label="Copy account" className="p-0.5 text-slate-400 hover:text-slate-700" onClick={copy}>
              <FiCopy className="h-3.5 w-3.5" />
            </button>
          </div>
          {copied ? <p className="mt-1 text-xs text-emerald-600">Copied</p> : null}
          <h1 className="mt-2 flex items-baseline text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl">
            {(user?.ridePoints ?? 0).toLocaleString()}
            <span className="ml-1.5 text-sm font-bold text-slate-500">PTS</span>
          </h1>
          <p className="mt-2 text-xs text-slate-400">Last updated {updated}</p>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/student/qr", label: "RIDE", icon: FiTruck },
              { href: "/student/fund", label: "FUND", icon: FiCreditCard },
              { href: "/student/profile", label: "PROFILE", icon: FiUser },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-card p-4 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                <div className="mb-2.5 flex h-12 w-12 items-center justify-center">
                  <item.icon className="h-8 w-8 text-blue-600" />
                </div>
                <span className="text-xs font-bold tracking-wider text-slate-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="relative flex items-center rounded-2xl border border-blue-100 bg-blue-50 p-3.5 text-blue-950 shadow-sm">
            <div className="mr-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <FiTruck className="h-8 w-8 text-blue-600" />
            </div>
            <div className="pr-2">
              <h3 className="flex items-center text-sm font-bold tracking-tight text-blue-900">
                Ride more. Save more. <span className="ml-1 text-xs">😎</span>
              </h3>
              <p className="mt-0.5 text-xs leading-snug text-blue-800/80">
                Transfer ₦250 to your Hyperion account to earn one ride point.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="col-span-12 lg:col-span-5 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">Past Rides</h2>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
          </div>
          <Link href="/student/rides" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View All
          </Link>
        </div>
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {trips.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No rides yet. Show your QR at the gate.</p>
          ) : (
            trips.slice(0, 6).map((trip, i) => <RideRow key={trip._id} trip={trip} index={i} perspective="student" />)
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
