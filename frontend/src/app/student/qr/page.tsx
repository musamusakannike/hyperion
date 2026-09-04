"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { Card } from "@/components/ui";
import { api, apiError } from "@/lib/api";

function QrInner() {
  const [src, setSrc] = useState("");
  const [payload, setPayload] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ payload: string }>("/api/me/qr")
      .then(async ({ data }) => {
        setPayload(data.payload);
        setSrc(await QRCode.toDataURL(data.payload, { margin: 1, width: 360, color: { dark: "#0e0e11", light: "#ffffff" } }));
      })
      .catch((err) => setError(apiError(err)));
  }, []);

  return (
    <AppShell tabs={studentTabs} title="Your QR">
      <div className="col-span-12 mx-auto max-w-md text-center">
        <h2 className="text-xl font-bold">Show this to the driver</h2>
        <p className="mt-1 text-sm text-zinc-400">Same code works until you rotate it. RFID will use the same wallet.</p>
        <Card className="mt-6 p-6">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Ride QR" className="mx-auto w-full max-w-xs rounded-2xl" />
          ) : (
            <p className="py-16 text-zinc-400">{error || "Loading QR…"}</p>
          )}
          <p className="mt-4 break-all text-[11px] text-zinc-500">{payload}</p>
        </Card>
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
