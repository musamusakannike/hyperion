"use client";

import { useEffect, useRef, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, driverTabs } from "@/components/shell";
import { Card, ErrorText, Field, PageIntro, PrimaryButton } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { ScanResult } from "@/lib/types";

function DriverScan() {
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [method, setMethod] = useState<"qr" | "rfid">("qr");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const regionId = "hyperion-qr-reader";
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  const submit = async (scanToken: string, scanMethod: "qr" | "rfid") => {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post<ScanResult>(
        "/api/scans",
        {
          method: scanMethod,
          token: scanToken,
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

  useEffect(() => {
    if (!camOn) return;
    let cancelled = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (cancelled) return;
            setToken(decoded);
            setMethod("qr");
            void scanner.stop();
            setCamOn(false);
            void submit(decoded, "qr");
          },
          () => undefined,
        );
      } catch (err) {
        setError(apiError(err, "Camera could not start"));
        setCamOn(false);
      }
    })();
    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOn]);

  return (
    <AppShell tabs={driverTabs} title="Scan">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <PageIntro title="Take a fare" subtitle="Ask for the PIN first. Then scan the QR or type the card number." />
        <Card className="p-5">
          <div className="space-y-3">
            <Field id="pin" label="Student PIN" hint="They tell you this out loud" value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" />
            <div className="flex gap-2">
              {(["qr", "rfid"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 rounded-2xl border-2 border-b-4 py-2 text-sm font-extrabold ${method === m ? "border-blue-700 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  {m === "qr" ? "QR code" : "Card"}
                </button>
              ))}
            </div>
            <Field
              id="token"
              label={method === "qr" ? "QR code text" : "Card number"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={method === "qr" ? "HYP:…" : "04A3B12C"}
            />
            <ErrorText>{error}</ErrorText>
            <PrimaryButton type="button" disabled={busy || !token || !pin} onClick={() => submit(token, method)}>
              {busy ? "Checking…" : "Take 1 ride"}
            </PrimaryButton>
            <PrimaryButton type="button" variant="secondary" onClick={() => setCamOn((v) => !v)}>
              {camOn ? "Stop camera" : "Open camera"}
            </PrimaryButton>
            {camOn ? <div id={regionId} className="overflow-hidden rounded-3xl" /> : null}
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
      <DriverScan />
    </Guard>
  );
}
