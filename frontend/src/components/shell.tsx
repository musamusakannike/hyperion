"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FiHome, FiCreditCard, FiMaximize, FiList, FiMoreHorizontal, FiUsers, FiLogOut } from "react-icons/fi";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "./ui";

type Tab = { href: string; label: string; icon: ReactNode; match?: string };

export function AppShell({
  children,
  tabs,
  title,
}: {
  children: ReactNode;
  tabs: Tab[];
  title?: string;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-app text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
          <Link href="/" className="mb-8 px-2 text-lg font-black tracking-tight text-blue-600">
            HYPERION
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {tabs.map((tab) => {
              const active = pathname === tab.href || (tab.match ? pathname.startsWith(tab.match) : false);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <FiLogOut />
              Sign out
            </button>
          ) : null}
        </aside>

        <div className="flex min-h-screen flex-1 flex-col bg-app lg:bg-transparent">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-24 lg:max-w-none lg:pb-8">
            <header className="flex items-center justify-between px-4 pt-5 lg:px-8 lg:pt-6">
              <div className="flex items-center gap-3">
                {user ? <Avatar name={user.fullName} size="sm" /> : null}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {title ?? "Hyperion"}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{user?.fullName ?? "Guest"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 lg:hidden"
              >
                Sign out
              </button>
            </header>
            <main className="flex-1 px-4 pt-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:px-8 lg:pt-6">{children}</main>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-1 flex-col items-center justify-center py-1 text-slate-500"
              >
                <div className={active ? "rounded-full bg-blue-600 px-4 py-1.5 text-white" : "p-1.5 text-slate-500"}>
                  {tab.icon}
                </div>
                <span className={`mt-1 text-[11px] ${active ? "font-semibold text-blue-600" : "font-medium text-slate-500"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export const studentTabs: Tab[] = [
  { href: "/student", label: "Home", icon: <FiHome className="h-5 w-5" /> },
  { href: "/student/rides", label: "Rides", icon: <FiList className="h-5 w-5" /> },
  { href: "/student/qr", label: "QR", icon: <FiMaximize className="h-5 w-5" /> },
  { href: "/student/fund", label: "Fund", icon: <FiCreditCard className="h-5 w-5" /> },
  { href: "/student/profile", label: "More", icon: <FiMoreHorizontal className="h-5 w-5" /> },
];

export const driverTabs: Tab[] = [
  { href: "/driver", label: "Scan", icon: <FiMaximize className="h-5 w-5" /> },
  { href: "/driver/trips", label: "Trips", icon: <FiList className="h-5 w-5" /> },
];

export const adminTabs: Tab[] = [
  { href: "/admin", label: "Home", icon: <FiHome className="h-5 w-5" /> },
  { href: "/admin/people", label: "People", icon: <FiUsers className="h-5 w-5" /> },
  { href: "/admin/trips", label: "Trips", icon: <FiList className="h-5 w-5" /> },
];
