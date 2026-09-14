"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMail, FiLock, FiUser, FiHash, FiKey } from "react-icons/fi";
import { ErrorText, Field, PrimaryButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { apiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    matricNumber: "",
    password: "",
    pin: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(form);
    } catch (err) {
      setError(apiError(err, "Could not make your account"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-10">
        <h1 className="text-3xl font-black text-slate-900">Join Hyperion</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">
          Students can sign up here. Drivers and admins are added by staff.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Field id="fullName" label="Your name" hint="As it appears on your ID" value={form.fullName} onChange={set("fullName")} required icon={<FiUser className="h-5 w-5" />} />
          <Field id="email" label="School email" type="email" value={form.email} onChange={set("email")} required icon={<FiMail className="h-5 w-5" />} />
          <Field id="matric" label="Matric number" value={form.matricNumber} onChange={set("matricNumber")} required icon={<FiHash className="h-5 w-5" />} />
          <Field id="password" label="Password" hint="At least 8 characters" type="password" value={form.password} onChange={set("password")} required minLength={8} icon={<FiLock className="h-5 w-5" />} />
          <Field
            id="pin"
            label="Ride PIN"
            hint="4–6 numbers. The driver will ask for this."
            inputMode="numeric"
            value={form.pin}
            onChange={set("pin")}
            required
            pattern="\d{4,6}"
            icon={<FiKey className="h-5 w-5" />}
          />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create my account"}
          </PrimaryButton>
        </form>
        <p className="mt-6 text-center text-sm font-bold text-slate-500">
          Already have an account?
          <Link href="/login" className="ml-1 font-extrabold text-blue-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
