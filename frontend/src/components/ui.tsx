"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  icon,
  trailing,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-200" htmlFor={props.id}>
        {label}
      </label>
      <div className="relative flex items-center">
        {icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
            {icon}
          </div>
        ) : null}
        <input
          {...props}
          className={`w-full rounded-xl border border-input-border bg-input py-3.5 text-sm text-white placeholder:text-[#63626e] transition duration-150 focus:border-accent-hi focus:outline-none focus:ring-1 focus:ring-accent-hi ${icon ? "pl-11" : "pl-4"} ${trailing ? "pr-11" : "pr-4"}`}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">{trailing}</div>
        ) : null}
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full cursor-pointer rounded-xl bg-accent py-3.5 text-sm font-semibold text-white shadow-lg transition duration-150 hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-card shadow-sm ${className}`}>{children}</div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initial = name.trim().charAt(0).toUpperCase() || "H";
  const dim = size === "lg" ? "h-24 w-24 text-3xl" : size === "sm" ? "h-11 w-11 text-base" : "h-12 w-12 text-lg";
  return (
    <div className={`relative flex-shrink-0 rounded-full bg-gradient-to-tr from-amber-600 via-rose-500 to-indigo-500 p-[2px] ${size === "lg" ? "p-[3px]" : ""}`}>
      <div
        className={`${dim} flex items-center justify-center overflow-hidden rounded-full border border-black bg-[#2a2430] font-bold text-white`}
      >
        {initial}
      </div>
    </div>
  );
}

export function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <span className="mt-1 inline-block rounded-full bg-[#133020] px-2 py-0.5 text-[10px] font-semibold text-[#2fe882]">
      {label}
    </span>
  ) : (
    <span className="mt-1 inline-block rounded-full bg-[#3a1515] px-2 py-0.5 text-[10px] font-semibold text-[#ff8a8a]">
      {label}
    </span>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-app-red">{children}</p>;
}
