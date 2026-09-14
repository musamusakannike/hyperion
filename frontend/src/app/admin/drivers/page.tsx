"use client";

import { useState } from "react";
import Link from "next/link";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { Card, ErrorText, Field, PageIntro, PrimaryButton, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";

function Inner() {
  const [driver, setDriver] = useState({ fullName: "", email: "", password: "DriverPass1!" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const createDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");
    try {
      await api.post("/api/admin/drivers", driver);
      setOk(`Created driver ${driver.fullName}.`);
      setDriver({ fullName: "", email: "", password: "DriverPass1!" });
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AppShell tabs={adminTabs} title="Add driver">
      <div className="col-span-12 mx-auto w-full max-w-lg">
        <Link href="/admin" className="mb-3 inline-block text-sm font-extrabold text-blue-600">
          ← Home
        </Link>
        <PageIntro title="Add a driver" subtitle="Drivers scan student QR codes or cards." />
        <Card className="p-5">
          <form className="space-y-3" onSubmit={createDriver}>
            <Field id="df" label="Full name" value={driver.fullName} onChange={(e) => setDriver({ ...driver, fullName: e.target.value })} required />
            <Field id="de" label="Email" type="email" value={driver.email} onChange={(e) => setDriver({ ...driver, email: e.target.value })} required />
            <Field id="dp" label="Starter password" value={driver.password} onChange={(e) => setDriver({ ...driver, password: e.target.value })} />
            <ErrorText>{error}</ErrorText>
            <SuccessText>{ok}</SuccessText>
            <PrimaryButton type="submit">Create driver</PrimaryButton>
          </form>
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
