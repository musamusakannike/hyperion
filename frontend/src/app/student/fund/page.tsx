"use client";

import { useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { Card, PrimaryButton } from "@/components/ui";
import { api, apiError } from "@/lib/api";
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
  const [amountNaira, setAmountNaira] = useState("250");
  const [paymentError, setPaymentError] = useState("");
  const [isStartingPayment, setIsStartingPayment] = useState(false);

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

  const startPayment = async () => {
    setPaymentError("");
    setIsStartingPayment(true);
    try {
      const { data } = await api.post<{ authorizationUrl: string }>("/api/me/funding/initialize", {
        amountNaira: Number(amountNaira),
      });
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setPaymentError(apiError(error, "Could not start your Paystack payment"));
      setIsStartingPayment(false);
    }
  };

  return (
    <AppShell tabs={studentTabs} title="Fund">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Balance</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">
            {wallet?.ridePoints ?? user?.ridePoints ?? 0} <span className="text-sm text-slate-400">PTS</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">
            ₦{((wallet?.ridePriceKobo ?? 25000) / 100).toFixed(0)} = 1 point
            {(wallet?.leftoverKobo ?? 0) > 0 ? ` · leftover ₦${((wallet?.leftoverKobo ?? 0) / 100).toFixed(0)}` : ""}
          </p>
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Pay online</h2>
          <p className="text-sm text-slate-500">Pay by card, bank transfer, or any payment method available in Paystack.</p>
          <label className="block text-sm font-medium text-slate-700" htmlFor="funding-amount">
            Amount (₦)
          </label>
          <input
            id="funding-amount"
            type="number"
            min="100"
            step="1"
            inputMode="numeric"
            value={amountNaira}
            onChange={(event) => setAmountNaira(event.target.value)}
            className="w-full rounded-xl border border-input-border bg-input px-4 py-3.5 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {paymentError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{paymentError}</p> : null}
          <PrimaryButton type="button" onClick={startPayment} disabled={isStartingPayment}>
            {isStartingPayment ? "Opening Paystack…" : "Continue to Paystack"}
          </PrimaryButton>
          <p className="text-xs text-slate-400">Your points are added only after Paystack sends a successful-payment webhook.</p>
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Paystack account</h2>
          <p className="text-sm text-slate-500">
            Transfer from any bank app. Points land after Paystack confirms the credit.
          </p>
          {[
            ["Bank", acct?.bankName || "Not issued yet"],
            ["Account number", acct?.accountNumber || "—"],
            ["Account name", acct?.accountName || "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
                <p className="font-semibold text-slate-900">{value}</p>
              </div>
              {label === "Account number" && acct?.accountNumber ? (
                <button type="button" onClick={() => copy(acct.accountNumber, "nuban")} className="text-slate-400 hover:text-slate-700">
                  <FiCopy />
                </button>
              ) : null}
            </div>
          ))}
          {copied === "nuban" ? <p className="text-xs text-emerald-600">Account number copied</p> : null}
          {!acct?.accountNumber ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
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
