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
      setError(apiError(err, "Could not sign in"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between px-6 pb-8 pt-10 lg:max-w-lg">
        <main className="flex flex-1 flex-col justify-center py-4">
          <section className="mb-8 mt-2 flex flex-col items-center text-center">
            <Avatar name="H" size="lg" />
            <h1 className="mt-6 text-2xl font-black uppercase tracking-tight sm:text-[28px]">Welcome back</h1>
            <p className="mt-3 text-base font-medium sm:text-lg">Hyperion ride points</p>
            <p className="mt-1 text-xs text-muted sm:text-sm">Sign in to your student, driver, or admin account</p>
          </section>

          <form className="space-y-4" onSubmit={onSubmit}>
            <Field
              id="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<FiMail className="h-5 w-5" />}
            />
            <Field
              id="password"
              label="Password"
              type={show ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<FiLock className="h-5 w-5" />}
              trailing={
                <button type="button" className="text-muted hover:text-gray-300" onClick={() => setShow((s) => !s)}>
                  {show ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              }
            />
            <ErrorText>{error}</ErrorText>
            <div className="pt-2">
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? "Signing in…" : "Sign In"}
              </PrimaryButton>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-muted sm:text-sm">
            Don&apos;t have an account?
            <Link href="/register" className="ml-1 font-medium text-accent-hi hover:underline">
              Sign up
            </Link>
          </p>
        </main>
        <footer className="mb-2 mt-8 flex items-center justify-center space-x-1.5 text-xs text-muted">
          <FiShield className="h-4 w-4" />
          <span>Secure login protected by Hyperion</span>
        </footer>
      </div>
    </div>
  );
}
