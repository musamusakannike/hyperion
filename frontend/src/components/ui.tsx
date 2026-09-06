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
      <label className="block text-sm font-medium text-slate-700" htmlFor={props.id}>
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
          className={`w-full rounded-xl border border-input-border bg-input py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${icon ? "pl-11" : "pl-4"} ${trailing ? "pr-11" : "pr-4"}`}
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
      className={`w-full cursor-pointer rounded-xl bg-accent py-3.5 text-sm font-semibold text-white shadow-md transition duration-150 hover:bg-accent-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-card shadow-sm ${className}`}>{children}</div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initial = name.trim().charAt(0).toUpperCase() || "H";
  const dim = size === "lg" ? "h-24 w-24 text-3xl" : size === "sm" ? "h-11 w-11 text-base" : "h-12 w-12 text-lg";
  return (
    <div className={`relative shrink-0 rounded-full bg-linear-to-tr from-blue-600 via-sky-500 to-indigo-600 p-0.5 ${size === "lg" ? "p-0.75" : ""}`}>
      <div
        className={`${dim} flex items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-blue-50 font-bold text-blue-700`}
      >
        {initial}
      </div>
    </div>
  );
}

export function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <span className="mt-1 inline-block rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
      {label}
    </span>
  ) : (
    <span className="mt-1 inline-block rounded-full border border-rose-200/60 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
      {label}
    </span>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{children}</p>;
}
