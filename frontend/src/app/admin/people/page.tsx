"use client";

import { useEffect, useMemo, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { Card, ErrorText, Field, PrimaryButton } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { User } from "@/lib/types";

type DeviceRow = {
  _id?: string;
  id?: string;
  deviceLabel: string;
  apiKeyPrefix: string;
  driverId: string | { _id?: string; fullName?: string; email?: string };
};

function userId(u: User) {
  return u.id || (u as User & { _id?: string })._id || "";
}

function Inner() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [query, setQuery] = useState("");
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

  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkUid, setLinkUid] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);

  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [deviceDriverId, setDeviceDriverId] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("Wokwi bus pod");
  const [issuedKey, setIssuedKey] = useState("");

  const load = async () => {
    const [{ data: usersData }, { data: deviceData }] = await Promise.all([
      api.get<{ users: User[] }>("/api/admin/users"),
      api.get<{ devices: DeviceRow[] }>("/api/admin/devices").catch(() => ({ data: { devices: [] } })),
    ]);
    setUsers(usersData.users ?? []);
    setDevices(deviceData.devices ?? []);
  };

  useEffect(() => {
    load().catch((err) => setError(apiError(err)));
  }, []);

  const students = useMemo(() => users.filter((u) => u.role === "student"), [users]);
  const drivers = useMemo(() => users.filter((u) => u.role === "driver"), [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.fullName, u.email, u.matricNumber, u.rfidUid]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [users, query]);

  const selectedStudent = students.find((s) => userId(s) === linkStudentId);

  const bindSelected = async () => {
    if (!linkStudentId || !linkUid.trim()) {
      setError("Pick a student and paste the RFID UID from the serial monitor (e.g. 01020304)");
      return;
    }
    setLinkBusy(true);
    setError("");
    setOkMsg("");
    try {
      await api.post(`/api/admin/students/${linkStudentId}/rfid`, { rfidUid: linkUid.trim() });
      setOkMsg(`Linked RFID ${linkUid.trim().toUpperCase()} to ${selectedStudent?.fullName ?? "student"}`);
      setLinkUid("");
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLinkBusy(false);
    }
  };

  const unbindSelected = async () => {
    if (!linkStudentId) return;
    setLinkBusy(true);
    setError("");
    try {
      await api.delete(`/api/admin/students/${linkStudentId}/rfid`);
      setOkMsg("RFID unbound");
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLinkBusy(false);
    }
  };

  const issueDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIssuedKey("");
    try {
      const { data } = await api.post<{ apiKey: string }>("/api/admin/devices", {
        driverId: deviceDriverId,
        deviceLabel,
      });
      setIssuedKey(data.apiKey);
      setOkMsg("Copy this device key into sketch.ino as DEVICE_KEY. It will not be shown again.");
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  };

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
        <Card className="border-blue-100 p-5">
          <h3 className="font-semibold text-slate-900">Link RFID card</h3>
          <p className="mt-1 text-xs text-slate-500">
            Tap the card on the ESP32, copy the UID from serial (e.g. <code>01020304</code>), pick the student, bind.
          </p>
          <div className="mt-3 space-y-3">
            <label className="block text-sm font-medium text-slate-700" htmlFor="link-student">
              Student
            </label>
            <select
              id="link-student"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900"
              value={linkStudentId}
              onChange={(e) => setLinkStudentId(e.target.value)}
            >
              <option value="">Select student…</option>
              {students.map((s) => {
                const id = userId(s);
                return (
                  <option key={id} value={id}>
                    {s.fullName}
                    {s.matricNumber ? ` · ${s.matricNumber}` : ""}
                    {s.rfidUid ? ` · ${s.rfidUid}` : ""}
                  </option>
                );
              })}
            </select>
            {selectedStudent?.rfidUid ? (
              <p className="text-xs font-medium text-emerald-700">Currently bound: {selectedStudent.rfidUid}</p>
            ) : selectedStudent ? (
              <p className="text-xs text-slate-400">No card bound yet</p>
            ) : null}
            <Field
              id="link-uid"
              label="RFID UID"
              placeholder="01020304"
              value={linkUid}
              onChange={(e) => setLinkUid(e.target.value)}
              autoCapitalize="characters"
            />
            <PrimaryButton type="button" disabled={linkBusy} onClick={bindSelected}>
              {linkBusy ? "Saving…" : "Bind card to student"}
            </PrimaryButton>
            {selectedStudent?.rfidUid ? (
              <button
                type="button"
                className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2 text-sm font-medium text-rose-700"
                onClick={unbindSelected}
                disabled={linkBusy}
              >
                Unbind card
              </button>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">Bus pod device key</h3>
          <p className="mt-1 text-xs text-slate-500">
            Wokwi 401 <code>Invalid device key</code> means sketch.ino still has the placeholder. Issue a real key and paste it as{" "}
            <code>DEVICE_KEY</code>.
          </p>
          <form className="mt-3 space-y-3" onSubmit={issueDevice}>
            <label className="block text-sm font-medium text-slate-700" htmlFor="dev-driver">
              Driver this pod belongs to
            </label>
            <select
              id="dev-driver"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
              value={deviceDriverId}
              onChange={(e) => setDeviceDriverId(e.target.value)}
            >
              <option value="">Select driver…</option>
              {drivers.map((d) => (
                <option key={userId(d)} value={userId(d)}>
                  {d.fullName}
                </option>
              ))}
            </select>
            <Field
              id="dev-label"
              label="Label"
              value={deviceLabel}
              onChange={(e) => setDeviceLabel(e.target.value)}
            />
            <PrimaryButton type="submit">Issue device key</PrimaryButton>
          </form>
          {issuedKey ? (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-emerald-300">{issuedKey}</pre>
          ) : null}
          {devices.length ? (
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              {devices.map((d) => (
                <li key={d.id || d._id}>
                  {d.deviceLabel} · {d.apiKeyPrefix}… ·{" "}
                  {typeof d.driverId === "object" ? d.driverId.fullName : "driver"}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">New student</h3>
          <form className="mt-3 space-y-3" onSubmit={createStudent}>
            <Field id="sf" label="Name" value={student.fullName} onChange={(e) => setStudent({ ...student, fullName: e.target.value })} />
            <Field id="se" label="Email" value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} />
            <Field id="sm" label="Matric" value={student.matricNumber} onChange={(e) => setStudent({ ...student, matricNumber: e.target.value })} />
            <Field id="sp" label="PIN" value={student.pin} onChange={(e) => setStudent({ ...student, pin: e.target.value })} />
            <PrimaryButton type="submit">Create student</PrimaryButton>
          </form>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">New driver</h3>
          <form className="mt-3 space-y-3" onSubmit={createDriver}>
            <Field id="df" label="Name" value={driver.fullName} onChange={(e) => setDriver({ ...driver, fullName: e.target.value })} />
            <Field id="de" label="Email" value={driver.email} onChange={(e) => setDriver({ ...driver, email: e.target.value })} />
            <PrimaryButton type="submit">Create driver</PrimaryButton>
          </form>
        </Card>
        <ErrorText>{error}</ErrorText>
        {okMsg ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{okMsg}</p> : null}
      </div>
      <div className="col-span-12 lg:col-span-8">
        <input
          className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          placeholder="Search name, matric, email, or RFID UID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Card className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">RFID</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const id = userId(u);
                return (
                <tr key={id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{u.fullName}</p>
                    <p className="text-xs text-slate-400">{u.matricNumber || u.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">{u.role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.role === "student" ? u.rfidUid || "—" : "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{u.role === "student" ? u.ridePoints : "—"}</td>
                  <td className="px-4 py-3">
                    {u.role === "student" ? (
                      <div className="flex flex-wrap gap-2">
                        <input
                          className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                          placeholder="+pts"
                          value={points[id] ?? ""}
                          onChange={(e) => setPoints((p) => ({ ...p, [id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="rounded-lg bg-accent px-2 py-1 text-xs text-white transition hover:bg-accent-hover"
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
                          className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                          placeholder="RFID UID"
                          value={rfid[id] ?? u.rfidUid ?? ""}
                          onChange={(e) => setRfid((p) => ({ ...p, [id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-200"
                          onClick={async () => {
                            setError("");
                            try {
                              await api.post(`/api/admin/students/${id}/rfid`, { rfidUid: rfid[id] || u.rfidUid });
                              await load();
                            } catch (err) {
                              setError(apiError(err));
                            }
                          }}
                        >
                          Bind
                        </button>
                        {u.rfidUid ? (
                          <button
                            type="button"
                            className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700"
                            onClick={async () => {
                              await api.delete(`/api/admin/students/${id}/rfid`);
                              await load();
                            }}
                          >
                            Unbind
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
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
