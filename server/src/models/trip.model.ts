import { Schema, model, type InferSchemaType } from "mongoose";

export const SCAN_METHODS = ["qr", "rfid"] as const;
export type ScanMethod = (typeof SCAN_METHODS)[number];

export const TRIP_STATUSES = ["success", "failed"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

const tripSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    driverId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    farePoints: { type: Number, required: true, default: 1 },
    fareKobo: { type: Number, required: true },
    method: { type: String, enum: SCAN_METHODS, required: true },
    status: { type: String, enum: TRIP_STATUSES, required: true },
    failReason: { type: String },
    requestId: { type: String, index: true },
  },
  { timestamps: true },
);

tripSchema.index({ driverId: 1, requestId: 1 }, { unique: true, sparse: true });
tripSchema.index({ createdAt: -1 });

export type TripDocument = InferSchemaType<typeof tripSchema>;

export const Trip = model("Trip", tripSchema);
