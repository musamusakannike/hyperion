import { Schema, model } from "mongoose";

export const LEDGER_REASONS = ["deposit", "ride", "admin_adjust"] as const;
export type LedgerReason = (typeof LEDGER_REASONS)[number];

const ledgerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deltaPoints: { type: Number, required: true },
    leftoverKoboAfter: { type: Number, default: 0 },
    reason: { type: String, enum: LEDGER_REASONS, required: true },
    note: { type: String },
    paystackReference: { type: String, unique: true, sparse: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip" },
  },
  { timestamps: true },
);

export const Ledger = model("Ledger", ledgerSchema);
