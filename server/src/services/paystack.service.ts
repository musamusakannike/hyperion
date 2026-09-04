import { createHmac } from "crypto";
import { env } from "../config/env.config";

const PAYSTACK_BASE = "https://api.paystack.co";

type PaystackCustomer = {
  status: boolean;
  message: string;
  data?: { customer_code: string; email: string };
};

type PaystackDedicatedAccount = {
  status: boolean;
  message: string;
  data?: {
    account_number: string;
    account_name: string;
    bank: { name: string };
    customer?: { customer_code: string };
  };
};

const paystackEnabled = (): boolean => Boolean(env.paystackSecretKey);

const paystackFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json()) as T & { message?: string; status?: boolean };
  if (!response.ok || (body as { status?: boolean }).status === false) {
    throw new Error((body as { message?: string }).message ?? "Paystack request failed");
  }
  return body;
};

export const verifyPaystackSignature = (rawBody: string, signature: string | undefined): boolean => {
  if (!paystackEnabled() || !signature) return false;
  const hash = createHmac("sha512", env.paystackSecretKey).update(rawBody).digest("hex");
  return hash === signature;
};

export const createStudentPaystackAccount = async (
  email: string,
  fullName: string,
): Promise<{
  customerCode: string;
  dedicatedAccount: { bankName: string; accountNumber: string; accountName: string };
} | null> => {
  if (!paystackEnabled()) {
    return null;
  }

  const names = fullName.trim().split(/\s+/);
  const first_name = names[0] ?? "Student";
  const last_name = names.slice(1).join(" ") || "Hyperion";

  const customer = await paystackFetch<PaystackCustomer>("/customer", {
    method: "POST",
    body: JSON.stringify({ email, first_name, last_name }),
  });

  const customerCode = customer.data?.customer_code;
  if (!customerCode) {
    throw new Error("Paystack did not return a customer code");
  }

  try {
    const dva = await paystackFetch<PaystackDedicatedAccount>("/dedicated_account", {
      method: "POST",
      body: JSON.stringify({ customer: customerCode, preferred_bank: "wema-bank" }),
    });

    return {
      customerCode,
      dedicatedAccount: {
        bankName: dva.data?.bank.name ?? "",
        accountNumber: dva.data?.account_number ?? "",
        accountName: dva.data?.account_name ?? "",
      },
    };
  } catch (error) {
    console.warn("Dedicated account not created (test keys may lack DVA):", error);
    return {
      customerCode,
      dedicatedAccount: { bankName: "", accountNumber: "", accountName: "" },
    };
  }
};
