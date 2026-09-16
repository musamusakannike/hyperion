"use client";

import { useEffect, useRef, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { Card, ErrorText, Field, PageIntro, PrimaryButton } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { ScanResult } from "@/lib/types";

function QrInner() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const regionId = "hyperion-student-qr-reader";
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  const submit = async (scanToken: string) => {
    if (!scanToken) {
      setError("Scan or paste the driver QR");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post<ScanResult>(
        "/api/scans",
        {
          method: "qr",
          token: scanToken,
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
            void scanner.stop();
            setCamOn(false);
            void submit(decoded);
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
    <AppShell tabs={studentTabs} title="Board">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <PageIntro title="Scan the driver" subtitle="Point your camera at the QR on the driver’s phone." />
        <Card className="p-5">
          <div className="space-y-3">
            <Field
              id="token"
              label="Driver QR text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="HYP:…"
            />
            <ErrorText>{error}</ErrorText>
            <PrimaryButton type="button" disabled={busy || !token} onClick={() => submit(token)}>
              {busy ? "Checking…" : "Board (1 ride)"}
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
              {result.ok ? "You’re on board" : "Didn’t work"}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">{result.message}</p>
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
    <Guard roles={["student"]}>
      <QrInner />
    </Guard>
  );
}
