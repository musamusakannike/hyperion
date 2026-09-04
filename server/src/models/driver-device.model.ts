import { Schema, model } from "mongoose";

const driverDeviceSchema = new Schema(
  {
    driverId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deviceLabel: { type: String, required: true, trim: true },
    apiKeyHash: { type: String, required: true, select: false },
    apiKeyPrefix: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const DriverDevice = model("DriverDevice", driverDeviceSchema);
