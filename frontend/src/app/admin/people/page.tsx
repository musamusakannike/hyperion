"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { Card, CopyButton, ErrorText, PageIntro, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { User } from "@/lib/types";

function userId(u: User) {
  return u.id || (u as User & { _id?: string })._id || "";
}

function Inner() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [query, setQuery] = useState("");
  const [points, setPoints] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await api.get<{ users: User[] }>("/api/admin/users");
    setUsers(data.users ?? []);
  };

  useEffect(() => {
    load().catch((err) => setError(apiError(err)));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.fullName, u.email, u.matricNumber, u.rfidUid].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [users, query]);

  return (
    <AppShell tabs={adminTabs} title="People">
      <div className="col-span-12">
        <PageIntro title="People" subtitle="Find someone. Add ride points. Other jobs are on their own pages." />
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href="/admin/students" className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700">
            + Student
          </Link>
          <Link href="/admin/drivers" className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700">
            + Driver
          </Link>
          <Link href="/admin/cards" className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700">
            Link card
          </Link>
        </div>
        <ErrorText>{error}</ErrorText>
        <SuccessText>{okMsg}</SuccessText>
        <input
          className="mb-3 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          placeholder="Search name, email, matric, or card"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b-2 border-slate-100 bg-slate-50 text-xs font-extrabold uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Card</th>
                <th className="px-4 py-3">Rides</th>
                <th className="px-4 py-3">Give points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const id = userId(u);
                return (
                  <tr key={id}>
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-slate-900">{u.fullName}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-400">{u.matricNumber || u.email}</p>
                        <CopyButton value={u.email} label="Email" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold capitalize text-slate-700">{u.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{u.role === "student" ? u.rfidUid || "—" : "—"}</span>
                        {u.rfidUid ? <CopyButton value={u.rfidUid} /> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-black">{u.role === "student" ? u.ridePoints : "—"}</td>
                    <td className="px-4 py-3">
                      {u.role === "student" ? (
                        <div className="flex gap-2">
                          <input
                            className="w-20 rounded-xl border-2 border-slate-200 px-2 py-1 text-sm font-bold"
                            placeholder="+5"
                            value={points[id] ?? ""}
                            onChange={(e) => setPoints((p) => ({ ...p, [id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="rounded-xl bg-accent px-3 py-1 text-xs font-extrabold text-white"
                            onClick={async () => {
                              setError("");
                              try {
                                await api.post(`/api/admin/students/${id}/points`, {
                                  deltaPoints: Number(points[id] || 0),
                                  note: "admin top-up",
                                });
                                setOkMsg(`Added points for ${u.fullName}`);
                                setPoints((p) => ({ ...p, [id]: "" }));
                                await load();
                              } catch (err) {
                                setError(apiError(err));
                              }
                            }}
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
