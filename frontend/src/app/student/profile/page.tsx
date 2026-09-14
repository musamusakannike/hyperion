"use client";

import { useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { Card, CopyButton, ErrorText, Field, PageIntro, PrimaryButton, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function ProfileInner() {
  const { user, logout } = useAuth();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const savePin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMsg("");
    try {
      await api.post("/api/auth/pin", { currentPin, newPin });
      setMsg("PIN saved");
      setCurrentPin("");
      setNewPin("");
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AppShell tabs={studentTabs} title="Me">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <PageIntro title="Your profile" subtitle="Keep your PIN private. Drivers will ask for it." />
        <Card className="space-y-2 p-5">
          <h2 className="text-lg font-black text-slate-900">{user?.fullName}</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">{user?.email}</p>
            <CopyButton value={user?.email} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">Matric · {user?.matricNumber}</p>
            <CopyButton value={user?.matricNumber ?? undefined} />
          </div>
          <p className="text-sm font-bold text-slate-500">{user?.hasRfid ? "Bus card linked" : "No bus card yet"}</p>
        </Card>
        <Card className="p-5">
          <h3 className="font-black text-slate-900">Change ride PIN</h3>
          <form className="mt-4 space-y-3" onSubmit={savePin}>
            <Field id="currentPin" label="Old PIN" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} />
            <Field id="newPin" label="New PIN" hint="4–6 numbers" value={newPin} onChange={(e) => setNewPin(e.target.value)} />
            <ErrorText>{error}</ErrorText>
            <SuccessText>{msg}</SuccessText>
            <PrimaryButton type="submit">Save PIN</PrimaryButton>
          </form>
        </Card>
        <PrimaryButton type="button" variant="ghost" onClick={logout}>
          Sign out
        </PrimaryButton>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Guard roles={["student"]}>
      <ProfileInner />
    </Guard>
  );
}
