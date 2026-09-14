"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { Card, CopyButton, PageIntro } from "@/components/ui";
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
        setSrc(await QRCode.toDataURL(data.payload, { margin: 1, width: 360, color: { dark: "#1d4ed8", light: "#ffffff" } }));
      })
      .catch((err) => setError(apiError(err)));
  }, []);

  return (
    <AppShell tabs={studentTabs} title="Board">
      <div className="col-span-12 mx-auto max-w-md text-center">
        <PageIntro title="Show this code" subtitle="Hold it up for the driver. Then tell them your PIN." />
        <Card className="mt-2 p-6">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Ride QR" className="mx-auto w-full max-w-xs rounded-3xl" />
          ) : (
            <p className="py-16 font-bold text-slate-400">{error || "Loading…"}</p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2">
            <p className="max-w-[70%] truncate text-[11px] font-bold text-slate-400">{payload}</p>
            <CopyButton value={payload} label="Copy code" />
          </div>
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
