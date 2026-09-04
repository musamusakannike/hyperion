import { Schema, model, type InferSchemaType } from "mongoose";

export const USER_ROLES = ["admin", "driver", "student"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const dedicatedAccountSchema = new Schema(
  {
    bankName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    accountName: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    role: { type: String, enum: USER_ROLES, required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    matricNumber: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    pinHash: { type: String, select: false },
    rfidUid: { type: String, unique: true, sparse: true, trim: true },
    qrToken: { type: String, unique: true, sparse: true, select: false },
    paystackCustomerCode: { type: String },
    dedicatedAccount: { type: dedicatedAccountSchema, default: () => ({}) },
    ridePoints: { type: Number, default: 0, min: 0 },
    leftoverKobo: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = String(ret._id);
    delete ret.passwordHash;
    delete ret.pinHash;
    delete ret.qrToken;
    return ret;
  },
});

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };

export const User = model("User", userSchema);
