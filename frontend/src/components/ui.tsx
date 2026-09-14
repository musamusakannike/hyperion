"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

export function Field({
  label,
  icon,
  trailing,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-extrabold text-slate-700" htmlFor={props.id}>
        {label}
      </label>
      {hint ? <p className="text-xs font-semibold text-slate-400">{hint}</p> : null}
      <div className="relative flex items-center">
        {icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
            {icon}
          </div>
        ) : null}
        <input
          {...props}
          className={`w-full rounded-2xl border-2 border-input-border bg-input py-3.5 text-sm font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 transition duration-150 focus:border-accent focus:outline-none ${icon ? "pl-11" : "pl-4"} ${trailing ? "pr-11" : "pr-4"}`}
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
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const look =
    variant === "secondary"
      ? "bg-white text-blue-700 border-2 border-b-4 border-blue-200 hover:bg-blue-50"
      : variant === "ghost"
        ? "bg-white text-slate-700 border-2 border-b-4 border-slate-200 hover:bg-slate-50"
        : variant === "danger"
          ? "bg-rose-500 text-white border-b-4 border-rose-700 hover:bg-rose-400"
          : "bg-accent text-white border-b-4 border-accent-shadow hover:bg-accent-hi";
  return (
    <button
      {...props}
      className={`w-full cursor-pointer rounded-2xl py-3.5 text-sm font-extrabold uppercase tracking-wide shadow-sm transition active:translate-y-0.5 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50 ${look} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border-2 border-slate-100 bg-card shadow-[0_8px_0_0_#e2e8f0] ${className}`}>
      {children}
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initial = name.trim().charAt(0).toUpperCase() || "H";
  const dim = size === "lg" ? "h-24 w-24 text-3xl" : size === "sm" ? "h-11 w-11 text-base" : "h-12 w-12 text-lg";
  return (
    <div className="relative shrink-0 rounded-full bg-linear-to-tr from-blue-600 via-sky-500 to-indigo-600 p-1">
      <div className={`${dim} flex items-center justify-center overflow-hidden rounded-full bg-blue-50 font-black text-blue-700`}>
        {initial}
      </div>
    </div>
  );
}

export function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <span className="mt-1 inline-block rounded-full bg-lime-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-lime-700">
      {label}
    </span>
  ) : (
    <span className="mt-1 inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-700">
      {label}
    </span>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{children}</p>
  );
}

export function SuccessText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-2xl border-2 border-lime-200 bg-lime-50 px-3 py-2 text-sm font-bold text-lime-800">{children}</p>
  );
}

export function PageIntro({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 animate-pop">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

export function CopyButton({ value, label = "Copy" }: { value?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-2.5 py-1.5 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100 active:scale-95"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? <FiCheck className="h-3.5 w-3.5" /> : <FiCopy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-extrabold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border-2 border-input-border bg-white px-3 py-3.5 text-sm font-bold text-slate-900 focus:border-accent focus:outline-none"
      >
        {children}
      </select>
    </div>
  );
}
