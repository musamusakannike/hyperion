"use client";

import { useState } from "react";
import Link from "next/link";
import { Guard } from "@/components/guard";
import { AppShell, adminTabs } from "@/components/shell";
import { Card, CopyButton, ErrorText, Field, PageIntro, PrimaryButton, SuccessText } from "@/components/ui";
import { api, apiError } from "@/lib/api";

function Inner() {
  const [student, setStudent] = useState({
    fullName: "",
    email: "",
    matricNumber: "",
    password: "StudentPass1!",
    pin: "1234",
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const createStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");
    try {
      await api.post("/api/admin/students", student);
      setOk(`Created ${student.fullName}. They can log in with ${student.email}.`);
      setStudent({ fullName: "", email: "", matricNumber: "", password: "StudentPass1!", pin: "1234" });
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AppShell tabs={adminTabs} title="Add student">
      <div className="col-span-12 mx-auto w-full max-w-lg">
        <Link href="/admin" className="mb-3 inline-block text-sm font-extrabold text-blue-600">
          ← Home
        </Link>
        <PageIntro title="Add a student" subtitle="They get an account, a PIN, and can buy rides." />
        <Card className="p-5">
          <form className="space-y-3" onSubmit={createStudent}>
            <Field id="sf" label="Full name" value={student.fullName} onChange={(e) => setStudent({ ...student, fullName: e.target.value })} required />
            <Field id="se" label="Email" type="email" value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} required />
            <Field id="sm" label="Matric number" value={student.matricNumber} onChange={(e) => setStudent({ ...student, matricNumber: e.target.value })} required />
            <Field id="spw" label="Starter password" value={student.password} onChange={(e) => setStudent({ ...student, password: e.target.value })} />
            <Field id="sp" label="Ride PIN" hint="4–6 numbers" value={student.pin} onChange={(e) => setStudent({ ...student, pin: e.target.value })} />
            <ErrorText>{error}</ErrorText>
            <SuccessText>{ok}</SuccessText>
            {ok ? <CopyButton value={student.email || ok} label="Copy note" /> : null}
            <PrimaryButton type="submit">Create student</PrimaryButton>
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
