"use client";

import { useEffect, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { Card, ErrorText, Field, PrimaryButton } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { User } from "@/lib/types";

function Inner() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [student, setStudent] = useState({
    fullName: "",
    email: "",
    matricNumber: "",
    password: "StudentPass1!",
    pin: "1234",
  });
  const [driver, setDriver] = useState({ fullName: "", email: "", password: "DriverPass1!" });
  const [points, setPoints] = useState<Record<string, string>>({});
  const [rfid, setRfid] = useState<Record<string, string>>({});

  const load = () => api.get<{ users: User[] }>("/api/admin/users").then(({ data }) => setUsers(data.users ?? []));

  useEffect(() => {
    load().catch((err) => setError(apiError(err)));
  }, []);

  const createStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/admin/students", student);
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const createDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/admin/drivers", driver);
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AppShell tabs={adminTabs} title="People">
      <div className="col-span-12 space-y-4 lg:col-span-4">
        <Card className="p-5">
          <h3 className="font-semibold">New student</h3>
          <form className="mt-3 space-y-3" onSubmit={createStudent}>
            <Field id="sf" label="Name" value={student.fullName} onChange={(e) => setStudent({ ...student, fullName: e.target.value })} />
            <Field id="se" label="Email" value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} />
            <Field id="sm" label="Matric" value={student.matricNumber} onChange={(e) => setStudent({ ...student, matricNumber: e.target.value })} />
            <Field id="sp" label="PIN" value={student.pin} onChange={(e) => setStudent({ ...student, pin: e.target.value })} />
            <PrimaryButton type="submit">Create student</PrimaryButton>
          </form>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">New driver</h3>
          <form className="mt-3 space-y-3" onSubmit={createDriver}>
            <Field id="df" label="Name" value={driver.fullName} onChange={(e) => setDriver({ ...driver, fullName: e.target.value })} />
            <Field id="de" label="Email" value={driver.email} onChange={(e) => setDriver({ ...driver, email: e.target.value })} />
            <PrimaryButton type="submit">Create driver</PrimaryButton>
          </form>
        </Card>
        <ErrorText>{error}</ErrorText>
      </div>
      <div className="col-span-12 lg:col-span-8">
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => {
                const id = u.id || (u as User & { _id?: string })._id || "";
                return (
                <tr key={id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{u.fullName}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">{u.role === "student" ? u.ridePoints : "—"}</td>
                  <td className="px-4 py-3">
                    {u.role === "student" ? (
                      <div className="flex flex-wrap gap-2">
                        <input
                          className="w-16 rounded-lg bg-input px-2 py-1"
                          placeholder="+pts"
                          value={points[id] ?? ""}
                          onChange={(e) => setPoints((p) => ({ ...p, [id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="rounded-lg bg-accent px-2 py-1 text-xs"
                          onClick={async () => {
                            await api.post(`/api/admin/students/${id}/points`, {
                              deltaPoints: Number(points[id] || 0),
                              note: "admin top-up",
                            });
                            await load();
                          }}
                        >
                          Add
                        </button>
                        <input
                          className="w-24 rounded-lg bg-input px-2 py-1"
                          placeholder="RFID UID"
                          value={rfid[id] ?? ""}
                          onChange={(e) => setRfid((p) => ({ ...p, [id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="rounded-lg bg-white/10 px-2 py-1 text-xs"
                          onClick={async () => {
                            await api.post(`/api/admin/students/${id}/rfid`, { rfidUid: rfid[id] });
                            await load();
                          }}
                        >
                          Bind
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-500">—</span>
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
