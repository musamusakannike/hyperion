import type { Types } from "mongoose";
import { env } from "../config/env.config";
import { Ledger } from "../models/ledger.model";
import { Trip, type ScanMethod } from "../models/trip.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { normalizeScanToken, verifySecret } from "../utils/crypto";

type ScanInput = {
  driverId: string;
  method: ScanMethod;
  token: string;
  pin?: string;
  requestId?: string;
};

export type ScanResult = {
  ok: boolean;
  code?: string;
  message: string;
  studentName?: string;
  remainingPoints?: number;
  tripId?: string;
};

export const performScan = async (input: ScanInput): Promise<ScanResult> => {
  if (input.requestId) {
    const prior = await Trip.findOne({ driverId: input.driverId, requestId: input.requestId });
    if (prior) {
      const student = await User.findById(prior.studentId);
      if (prior.status === "success") {
        return {
          ok: true,
          message: "Ride already recorded",
          studentName: student?.fullName,
          remainingPoints: student?.ridePoints,
          tripId: String(prior._id),
        };
      }
      return {
        ok: false,
        code: prior.failReason ?? undefined,
        message: "This scan was already recorded as failed",
      };
    }
  }

  const token = normalizeScanToken(input.token);
  const studentQuery =
    input.method === "rfid" ? { rfidUid: token, role: "student" as const } : { qrToken: token, role: "student" as const };

  const student = await User.findOne(studentQuery).select("+pinHash +qrToken");

  const fail = async (code: string, message: string, studentId: Types.ObjectId) => {
    const trip = await Trip.create({
      studentId,
      driverId: input.driverId,
      farePoints: 1,
      fareKobo: env.ridePriceKobo,
      method: input.method,
      status: "failed",
      failReason: code,
      requestId: input.requestId,
    });
    return { ok: false, code, message, tripId: String(trip._id) } satisfies ScanResult;
  };

  if (!student || !student.isActive) {
    throw new AppError("Unknown card or QR code", 404, "UNKNOWN_CARD");
  }

  if (env.scanPinRequired) {
    if (!input.pin || !student.pinHash || !(await verifySecret(input.pin, student.pinHash))) {
      return fail("BAD_PIN", "Incorrect PIN", student._id);
    }
  }

  const updated = await User.findOneAndUpdate(
    { _id: student._id, ridePoints: { $gte: 1 }, isActive: true },
    { $inc: { ridePoints: -1 } },
    { new: true },
  );

  if (!updated) {
    return fail("INSUFFICIENT_POINTS", "Not enough ride points", student._id);
  }

  const trip = await Trip.create({
    studentId: student._id,
    driverId: input.driverId,
    farePoints: 1,
    fareKobo: env.ridePriceKobo,
    method: input.method,
    status: "success",
    requestId: input.requestId,
  });

  await Ledger.create({
    userId: student._id,
    deltaPoints: -1,
    leftoverKoboAfter: updated.leftoverKobo,
    reason: "ride",
    tripId: trip._id,
  });

  return {
    ok: true,
    message: "Ride deducted",
    studentName: student.fullName,
    remainingPoints: updated.ridePoints,
    tripId: String(trip._id),
  };
};
