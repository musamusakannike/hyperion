"use client";

import { useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { Card, ErrorText, Field, PrimaryButton } from "@/components/ui";
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
      setMsg("PIN updated");
      setCurrentPin("");
      setNewPin("");
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AppShell tabs={studentTabs} title="Profile">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <Card className="space-y-2 p-5">
          <h2 className="text-lg font-semibold text-slate-900">{user?.fullName}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="text-sm text-slate-500">Matric · {user?.matricNumber}</p>
          <p className="text-sm text-slate-500">{user?.hasRfid ? "RFID card bound" : "No RFID card yet"}</p>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">Change ride PIN</h3>
          <form className="mt-4 space-y-3" onSubmit={savePin}>
            <Field id="currentPin" label="Current PIN" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} />
            <Field id="newPin" label="New PIN" value={newPin} onChange={(e) => setNewPin(e.target.value)} />
            <ErrorText>{error}</ErrorText>
            {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
            <PrimaryButton type="submit">Update PIN</PrimaryButton>
          </form>
        </Card>
        <button type="button" onClick={logout} className="w-full rounded-xl border border-slate-200 py-3 text-sm text-slate-700 hover:bg-slate-50 transition">
          Sign out
        </button>
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
