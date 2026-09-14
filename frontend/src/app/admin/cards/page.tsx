"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { Card, CopyButton, ErrorText, Field, PageIntro, PrimaryButton, SelectField, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";
import type { User } from "@/lib/types";

function userId(u: User) {
  return u.id || (u as User & { _id?: string })._id || "";
}

function Inner() {
  const [students, setStudents] = useState<User[]>([]);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkUid, setLinkUid] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = async () => {
    const { data } = await api.get<{ users: User[] }>("/api/admin/users");
    setStudents((data.users ?? []).filter((u) => u.role === "student"));
  };

  useEffect(() => {
    load().catch((err) => setError(apiError(err)));
  }, []);

  const selected = students.find((s) => userId(s) === linkStudentId);

  const bind = async () => {
    if (!linkStudentId || !linkUid.trim()) {
      setError("Pick a student and type the card number.");
      return;
    }
    setBusy(true);
    setError("");
    setOk("");
    try {
      await api.post(`/api/admin/students/${linkStudentId}/rfid`, { rfidUid: linkUid.trim() });
      setOk(`Linked card ${linkUid.trim().toUpperCase()} to ${selected?.fullName ?? "student"}`);
      setLinkUid("");
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const unbind = async () => {
    if (!linkStudentId) return;
    setBusy(true);
    try {
      await api.delete(`/api/admin/students/${linkStudentId}/rfid`);
      setOk("Card unlinked");
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell tabs={adminTabs} title="Cards">
      <div className="col-span-12 mx-auto w-full max-w-lg">
        <Link href="/admin" className="mb-3 inline-block text-sm font-extrabold text-blue-600">
          ← Home
        </Link>
        <PageIntro
          title="Link a bus card"
          subtitle="Tap the card on the reader, copy the number, pick the student, then save."
        />
        <Card className="space-y-3 p-5">
          <SelectField id="link-student" label="Student" value={linkStudentId} onChange={setLinkStudentId}>
            <option value="">Pick a student…</option>
            {students.map((s) => (
              <option key={userId(s)} value={userId(s)}>
                {s.fullName}
                {s.matricNumber ? ` · ${s.matricNumber}` : ""}
              </option>
            ))}
          </SelectField>
          {selected?.rfidUid ? (
            <div className="flex items-center justify-between rounded-2xl bg-lime-50 px-3 py-2">
              <p className="text-sm font-bold text-lime-800">Current card {selected.rfidUid}</p>
              <CopyButton value={selected.rfidUid} />
            </div>
          ) : selected ? (
            <p className="text-xs font-bold text-slate-400">No card yet</p>
          ) : null}
          <Field id="link-uid" label="Card number" placeholder="01020304" value={linkUid} onChange={(e) => setLinkUid(e.target.value)} />
          <ErrorText>{error}</ErrorText>
          <SuccessText>{ok}</SuccessText>
          <PrimaryButton type="button" disabled={busy} onClick={bind}>
            {busy ? "Saving…" : "Save card"}
          </PrimaryButton>
          {selected?.rfidUid ? (
            <PrimaryButton type="button" variant="danger" disabled={busy} onClick={unbind}>
              Unlink card
            </PrimaryButton>
          ) : null}
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
