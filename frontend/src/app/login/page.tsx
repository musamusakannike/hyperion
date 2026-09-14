"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from "react-icons/fi";
import { Avatar, ErrorText, Field, PrimaryButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { apiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(apiError(err, "Wrong email or password"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between px-6 pb-8 pt-10">
        <main className="flex flex-1 flex-col justify-center py-4">
          <section className="mb-8 flex flex-col items-center text-center animate-pop">
            <Avatar name="H" size="lg" />
            <h1 className="mt-6 text-3xl font-black text-slate-900">Hi again!</h1>
            <p className="mt-2 text-base font-bold text-slate-600">Log in to ride the campus bus.</p>
          </section>

          <form className="space-y-4" onSubmit={onSubmit}>
            <Field
              id="email"
              label="Email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<FiMail className="h-5 w-5" />}
            />
            <Field
              id="password"
              label="Password"
              type={show ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<FiLock className="h-5 w-5" />}
              trailing={
                <button type="button" className="text-muted hover:text-slate-700" onClick={() => setShow((s) => !s)}>
                  {show ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              }
            />
            <ErrorText>{error}</ErrorText>
            <div className="pt-2">
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? "Please wait…" : "Let’s go"}
              </PrimaryButton>
            </div>
          </form>

          <p className="mt-6 text-center text-sm font-bold text-slate-500">
            New here?
            <Link href="/register" className="ml-1 font-extrabold text-blue-600">
              Make an account
            </Link>
          </p>
        </main>
        <footer className="mt-8 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400">
          <FiShield className="h-4 w-4" />
          <span>Safe login</span>
        </footer>
      </div>
    </div>
  );
}
