"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { Card, CopyButton, ErrorText, Field, PageIntro, PrimaryButton, SelectField, SuccessText } from "@/components/ui";
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
  const [drivers, setDrivers] = useState<User[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [deviceDriverId, setDeviceDriverId] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("Bus scanner");
  const [issuedKey, setIssuedKey] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = async () => {
    const [{ data: usersData }, { data: deviceData }] = await Promise.all([
      api.get<{ users: User[] }>("/api/admin/users"),
      api.get<{ devices: DeviceRow[] }>("/api/admin/devices").catch(() => ({ data: { devices: [] } })),
    ]);
    setDrivers((usersData.users ?? []).filter((u) => u.role === "driver"));
    setDevices(deviceData.devices ?? []);
  };

  useEffect(() => {
    load().catch((err) => setError(apiError(err)));
  }, []);

  const issueDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIssuedKey("");
    setOk("");
    try {
      const { data } = await api.post<{ apiKey: string }>("/api/admin/devices", {
        driverId: deviceDriverId,
        deviceLabel,
      });
      setIssuedKey(data.apiKey);
      setOk("Copy this key now. You will not see it again.");
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AppShell tabs={adminTabs} title="Bus keys">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <Link href="/admin" className="mb-1 inline-block text-sm font-extrabold text-blue-600">
          ← Home
        </Link>
        <PageIntro
          title="Bus scanner keys"
          subtitle="Each hardware scanner needs a secret key. Paste it into the device."
        />
        <Card className="p-5">
          <form className="space-y-3" onSubmit={issueDevice}>
            <SelectField id="dev-driver" label="Which driver?" value={deviceDriverId} onChange={setDeviceDriverId}>
              <option value="">Pick a driver…</option>
              {drivers.map((d) => (
                <option key={userId(d)} value={userId(d)}>
                  {d.fullName}
                </option>
              ))}
            </SelectField>
            <Field id="dev-label" label="Name this scanner" value={deviceLabel} onChange={(e) => setDeviceLabel(e.target.value)} />
            <ErrorText>{error}</ErrorText>
            <SuccessText>{ok}</SuccessText>
            {issuedKey ? (
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="break-all font-mono text-xs text-lime-300">{issuedKey}</p>
                <div className="mt-2">
                  <CopyButton value={issuedKey} label="Copy key" />
                </div>
              </div>
            ) : null}
            <PrimaryButton type="submit">Make a new key</PrimaryButton>
          </form>
        </Card>
        <Card className="p-5">
          <h3 className="font-black text-slate-900">Existing scanners</h3>
          {devices.length === 0 ? (
            <p className="mt-2 text-sm font-bold text-slate-400">None yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {devices.map((d) => (
                <li key={d.id || d._id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-extrabold">{d.deviceLabel}</p>
                    <p className="text-xs font-bold text-slate-400">
                      {d.apiKeyPrefix}… · {typeof d.driverId === "object" ? d.driverId.fullName : "driver"}
                    </p>
                  </div>
                  <CopyButton value={d.apiKeyPrefix} label="Prefix" />
                </li>
              ))}
            </ul>
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
