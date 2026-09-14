"use client";

import { useEffect, useState } from "react";
import { Guard } from "@/components/guard";
import { AppShell, studentTabs } from "@/components/shell";
import { Card, CopyButton, ErrorText, PageIntro, PrimaryButton } from "@/components/ui";
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
  const [amountNaira, setAmountNaira] = useState("250");
  const [paymentError, setPaymentError] = useState("");
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [mode, setMode] = useState<"pay" | "transfer">("pay");

  useEffect(() => {
    refresh();
    api.get("/api/me/wallet").then(({ data }) => setWallet(data));
  }, [refresh]);

  const acct = wallet?.dedicatedAccount ?? user?.dedicatedAccount;

  const startPayment = async () => {
    setPaymentError("");
    setIsStartingPayment(true);
    try {
      const { data } = await api.post<{ authorizationUrl: string }>("/api/me/funding/initialize", {
        amountNaira: Number(amountNaira),
      });
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setPaymentError(apiError(error, "Could not open payment"));
      setIsStartingPayment(false);
    }
  };

  const ridesFromAmount = Math.floor(Number(amountNaira || 0) / 250);

  return (
    <AppShell tabs={studentTabs} title="Add rides">
      <div className="col-span-12 mx-auto w-full max-w-lg space-y-4">
        <PageIntro title="Buy more rides" subtitle="Each ₦250 gives you 1 ride point." />
        <Card className="p-5">
          <p className="text-xs font-extrabold uppercase tracking-wider text-blue-500">You have</p>
          <p className="mt-1 text-4xl font-black text-slate-900">{wallet?.ridePoints ?? user?.ridePoints ?? 0}</p>
          <p className="text-sm font-bold text-slate-500">ride{((wallet?.ridePoints ?? user?.ridePoints ?? 0) === 1) ? "" : "s"} left</p>
        </Card>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("pay")}
            className={`flex-1 rounded-2xl border-2 border-b-4 py-2.5 text-sm font-extrabold ${mode === "pay" ? "border-blue-700 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
          >
            Pay now
          </button>
          <button
            type="button"
            onClick={() => setMode("transfer")}
            className={`flex-1 rounded-2xl border-2 border-b-4 py-2.5 text-sm font-extrabold ${mode === "transfer" ? "border-blue-700 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
          >
            Bank transfer
          </button>
        </div>

        {mode === "pay" ? (
          <Card className="space-y-3 p-5">
            <h2 className="text-lg font-black text-slate-900">Pay with card or bank</h2>
            <p className="text-sm font-semibold text-slate-500">We open a secure Paystack page. Points show up after payment succeeds.</p>
            <label className="block text-sm font-extrabold text-slate-700" htmlFor="funding-amount">
              How much? (₦)
            </label>
            <input
              id="funding-amount"
              type="number"
              min="100"
              value={amountNaira}
              onChange={(event) => setAmountNaira(event.target.value)}
              className="w-full rounded-2xl border-2 border-input-border px-4 py-3.5 text-sm font-bold"
            />
            <p className="text-xs font-bold text-blue-600">About {ridesFromAmount || 0} ride{ridesFromAmount === 1 ? "" : "s"}</p>
            <ErrorText>{paymentError}</ErrorText>
            <PrimaryButton type="button" onClick={startPayment} disabled={isStartingPayment}>
              {isStartingPayment ? "Opening…" : "Pay"}
            </PrimaryButton>
          </Card>
        ) : (
          <Card className="space-y-3 p-5">
            <h2 className="text-lg font-black text-slate-900">Send money to this account</h2>
            <p className="text-sm font-semibold text-slate-500">Use any bank app. Points appear after the bank confirms.</p>
            {[
              ["Bank", acct?.bankName || "Not ready yet"],
              ["Account number", acct?.accountNumber || "—"],
              ["Account name", acct?.accountName || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase text-slate-400">{label}</p>
                  <p className="font-extrabold text-slate-900">{value}</p>
                </div>
                {label === "Account number" ? <CopyButton value={acct?.accountNumber} /> : null}
                {label === "Account name" ? <CopyButton value={acct?.accountName} /> : null}
              </div>
            ))}
            {!acct?.accountNumber ? (
              <p className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
                No bank account yet. Ask staff to add points for you.
              </p>
            ) : null}
            <PrimaryButton type="button" variant="secondary" onClick={() => refresh()}>
              Check my points
            </PrimaryButton>
          </Card>
        )}
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
