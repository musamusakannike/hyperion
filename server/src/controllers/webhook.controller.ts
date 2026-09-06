import type { RequestHandler } from "express";
import type express from "express";
import { env } from "../config/env.config";
import { User } from "../models/user.model";
import { verifyPaystackSignature } from "../services/paystack.service";
import { creditFromDeposit } from "../services/wallet.service";

type PaystackWebhook = {
  event: string;
  data: {
    reference?: string;
    amount?: number;
    customer?: { customer_code?: string; email?: string };
    dedicated_account?: { account_number?: string };
    metadata?: { userId?: string };
  };
};

export const paystackWebhook: RequestHandler = async (request, response, next) => {
  try {
    const raw =
      (request as express.Request & { rawBody?: string }).rawBody ??
      (typeof request.body === "string" ? request.body : JSON.stringify(request.body));
    const signature = request.header("x-paystack-signature");
    if (!env.paystackSecretKey || !verifyPaystackSignature(raw, signature)) {
      response.status(401).json({ message: "Invalid Paystack signature" });
      return;
    }

    const payload = (typeof request.body === "string" ? JSON.parse(request.body) : request.body) as PaystackWebhook;
    const creditEvents = new Set(["charge.success", "dedicatedaccount.assign.success"]);

    if (payload.event === "charge.success" && payload.data.amount && payload.data.reference) {
      const customerCode = payload.data.customer?.customer_code;
      const email = payload.data.customer?.email;
      const metadataUserId = payload.data.metadata?.userId;
      const user = metadataUserId
        ? await User.findOne({ _id: metadataUserId, role: "student" })
        : customerCode
        ? await User.findOne({ paystackCustomerCode: customerCode })
        : email
          ? await User.findOne({ email })
          : null;

      if (user) {
        await creditFromDeposit({
          userId: user.id,
          amountKobo: payload.data.amount,
          paystackReference: payload.data.reference,
        });
      }
    }

    if (!creditEvents.has(payload.event) && payload.event) {
      // Acknowledge unknown events so Paystack does not retry forever.
    }

    response.json({ received: true });
  } catch (error) {
    next(error);
  }
};
