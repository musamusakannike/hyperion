"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Guard } from "@/components/guard";
import { AppShell, driverTabs } from "@/components/shell";
import { Card, CopyButton, ErrorText, Field, PageIntro, PrimaryButton } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { ScanResult } from "@/lib/types";

function DriverBoard() {
  const [src, setSrc] = useState("");
  const [payload, setPayload] = useState("");
  const [qrError, setQrError] = useState("");

  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<{ payload: string }>("/api/me/qr")
      .then(async ({ data }) => {
        setPayload(data.payload);
        setSrc(
          await QRCode.toDataURL(data.payload, {
            margin: 1,
            width: 360,
            color: { dark: "#1d4ed8", light: "#ffffff" },
          }),
        );
      })
      .catch((err) => setQrError(apiError(err)));
  }, []);

  const submitCard = async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post<ScanResult>(
        "/api/scans",
        {
          method: "rfid",
          token,
          pin,
          requestId: crypto.randomUUID(),
        },
        { validateStatus: (status) => status < 500 },
      );
      setResult(data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell tabs={driverTabs} title="Board">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <PageIntro title="Show this code" subtitle="Students scan it to board. Use the card form below for RFID taps." />
        <Card className="p-6 text-center">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Driver boarding QR" className="mx-auto w-full max-w-xs rounded-3xl" />
          ) : (
            <p className="py-16 font-bold text-slate-400">{qrError || "Loading…"}</p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2">
            <p className="max-w-[70%] truncate text-[11px] font-bold text-slate-400">{payload}</p>
            <CopyButton value={payload} label="Copy code" />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-extrabold text-slate-900">Take a card fare</p>
          <p className="mb-3 text-xs font-bold text-slate-400">Ask for the PIN, then type the card number.</p>
          <div className="space-y-3">
            <Field id="pin" label="Student PIN" hint="They tell you this out loud" value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" />
            <Field id="token" label="Card number" value={token} onChange={(e) => setToken(e.target.value)} placeholder="04A3B12C" />
            <ErrorText>{error}</ErrorText>
            <PrimaryButton type="button" disabled={busy || !token || !pin} onClick={submitCard}>
              {busy ? "Checking…" : "Take 1 ride"}
            </PrimaryButton>
          </div>
        </Card>
        {result ? (
          <Card className={`p-5 ${result.ok ? "border-lime-200 bg-lime-50" : "border-rose-200 bg-rose-50"}`}>
            <p className={`text-lg font-black ${result.ok ? "text-lime-800" : "text-rose-800"}`}>
              {result.ok ? "Nice! Ride saved" : "Didn’t work"}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">{result.message}</p>
            {result.studentName ? <p className="mt-2 font-black text-slate-900">{result.studentName}</p> : null}
            {typeof result.remainingPoints === "number" ? (
              <p className="text-sm font-bold text-slate-500">{result.remainingPoints} rides left</p>
            ) : null}
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Guard roles={["driver"]}>
      <DriverBoard />
    </Guard>
  );
}
