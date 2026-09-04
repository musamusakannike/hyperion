"use client";

import { useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { Card, PrimaryButton } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function FundInner() {
  const { user, refresh } = useAuth();
  const [wallet, setWallet] = useState<{
    ridePoints: number;
    leftoverKobo: number;
    ridePriceKobo: number;
    dedicatedAccount?: { bankName?: string; accountNumber?: string; accountName?: string };
  } | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    refresh();
    api.get("/api/me/wallet").then(({ data }) => setWallet(data));
  }, [refresh]);

  const acct = wallet?.dedicatedAccount ?? user?.dedicatedAccount;
  const copy = async (value?: string, key?: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key ?? "ok");
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <AppShell tabs={studentTabs} title="Fund">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Balance</p>
          <p className="mt-1 text-3xl font-extrabold">
            {wallet?.ridePoints ?? user?.ridePoints ?? 0} <span className="text-sm text-zinc-400">PTS</span>
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            ₦{((wallet?.ridePriceKobo ?? 25000) / 100).toFixed(0)} = 1 point
            {(wallet?.leftoverKobo ?? 0) > 0 ? ` · leftover ₦${((wallet?.leftoverKobo ?? 0) / 100).toFixed(0)}` : ""}
          </p>
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-semibold">Paystack account</h2>
          <p className="text-sm text-zinc-400">
            Transfer from any bank app. Points land after Paystack confirms the credit.
          </p>
          {[
            ["Bank", acct?.bankName || "Not issued yet"],
            ["Account number", acct?.accountNumber || "—"],
            ["Account name", acct?.accountName || "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
              {label === "Account number" && acct?.accountNumber ? (
                <button type="button" onClick={() => copy(acct.accountNumber, "nuban")} className="text-zinc-300">
                  <FiCopy />
                </button>
              ) : null}
            </div>
          ))}
          {copied === "nuban" ? <p className="text-xs text-app-green">Account number copied</p> : null}
          {!acct?.accountNumber ? (
            <p className="text-sm text-amber-300">
              No dedicated account yet (Paystack test keys often skip this). Ask an admin to add points for the demo.
            </p>
          ) : null}
          <PrimaryButton type="button" onClick={() => refresh()}>
            Refresh balance
          </PrimaryButton>
        </Card>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Guard roles={["student"]}>
      <FundInner />
    </Guard>
  );
}
