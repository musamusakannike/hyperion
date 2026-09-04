"use client";

import { useEffect, useRef, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, driverTabs } from "@/components/shell";
import { Card, ErrorText, Field, PrimaryButton } from "@/components/ui";
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
    <AppShell tabs={driverTabs} title="Driver">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <Card className="p-5">
          <h2 className="text-xl font-bold">Scan a ride</h2>
          <p className="mt-1 text-sm text-zinc-400">Ask for the student PIN, then scan their QR or type an RFID UID.</p>
          <div className="mt-4 space-y-3">
            <Field id="pin" label="Student PIN" value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" />
            <div className="flex gap-2">
              {(["qr", "rfid"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold ${method === m ? "bg-accent" : "bg-white/5"}`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            <Field
              id="token"
              label={method === "qr" ? "QR payload" : "RFID UID"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={method === "qr" ? "HYP:…" : "04A3B12C"}
            />
            <ErrorText>{error}</ErrorText>
            <PrimaryButton type="button" disabled={busy || !token || !pin} onClick={() => submit(token, method)}>
              {busy ? "Checking…" : "Charge 1 point"}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setCamOn((v) => !v)}
              className="w-full rounded-xl border border-white/10 py-3 text-sm"
            >
              {camOn ? "Stop camera" : "Open camera"}
            </button>
            {camOn ? <div id={regionId} className="overflow-hidden rounded-2xl" /> : null}
          </div>
        </Card>
        {result ? (
          <Card className={`p-5 ${result.ok ? "border-app-green/40" : "border-app-red/40"}`}>
            <p className="text-lg font-bold">{result.ok ? "Ride recorded" : "Scan failed"}</p>
            <p className="mt-1 text-sm text-zinc-300">{result.message}</p>
            {result.studentName ? <p className="mt-2 font-semibold">{result.studentName}</p> : null}
            {typeof result.remainingPoints === "number" ? (
              <p className="text-sm text-zinc-400">{result.remainingPoints} pts left</p>
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
