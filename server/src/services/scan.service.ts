import type { Types } from "mongoose";
import { env } from "../config/env.config";
import { Ledger } from "../models/ledger.model";
import { Trip, type ScanMethod } from "../models/trip.model";
import { User } from "../models/user.model";
import { notifyLowBalance, notifyRideConfirmed, notifyRideFailed } from "./notification.service";
import { AppError } from "../utils/app-error";
import { normalizeRfidUid, normalizeScanToken, verifySecret } from "../utils/crypto";

type ScanInput = {
  actorId: string;
  actorRole: "student" | "driver";
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

const replayResult = async (prior: { _id: unknown; status: string; failReason?: string | null; studentId: Types.ObjectId }): Promise<ScanResult> => {
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
};

export const performScan = async (input: ScanInput): Promise<ScanResult> => {
  if (input.method === "qr") {
    if (input.actorRole !== "student") {
      throw new AppError("Students scan the driver QR to board", 403, "FORBIDDEN");
    }
  } else if (input.actorRole !== "driver") {
    throw new AppError("Only a driver or bus reader can take a card tap", 403, "FORBIDDEN");
  }

  const driverId = input.method === "qr" ? undefined : input.actorId;
  const studentIdForReplay = input.method === "qr" ? input.actorId : undefined;

  if (input.requestId) {
    const prior = await Trip.findOne(
      studentIdForReplay
        ? { studentId: studentIdForReplay, requestId: input.requestId }
        : { driverId, requestId: input.requestId },
    );
    if (prior) return replayResult(prior);
  }

  let student;
  let driverIdResolved: Types.ObjectId | string;

  if (input.method === "qr") {
    const token = normalizeScanToken(input.token);
    const driver = await User.findOne({ qrToken: token, role: "driver" }).select("+qrToken");
    if (!driver || !driver.isActive) {
      throw new AppError("Unknown QR code", 404, "UNKNOWN_QR");
    }
    student = await User.findById(input.actorId).select("+pinHash");
    if (!student || student.role !== "student" || !student.isActive) {
      throw new AppError("Student account is not active", 403, "FORBIDDEN");
    }
    driverIdResolved = driver._id;
  } else {
    const token = normalizeRfidUid(input.token);
    student = await User.findOne({ rfidUid: token, role: "student" }).select("+pinHash");
    driverIdResolved = input.actorId;
  }

  const fail = async (code: string, message: string, studentId: Types.ObjectId) => {
    const trip = await Trip.create({
      studentId,
      driverId: driverIdResolved,
      farePoints: 1,
      fareKobo: env.ridePriceKobo,
      method: input.method,
      status: "failed",
      failReason: code,
      requestId: input.requestId,
    });

    void notifyRideFailed({
      studentId: String(studentId),
      code,
      message,
    });

    return { ok: false, code, message, tripId: String(trip._id) } satisfies ScanResult;
  };

  if (!student || !student.isActive) {
    throw new AppError(input.method === "qr" ? "Unknown QR code" : "Unknown card or QR code", 404, "UNKNOWN_CARD");
  }

  if (input.method === "rfid" && env.scanPinRequired) {
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
    driverId: driverIdResolved,
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

  void notifyRideConfirmed({
    studentId: String(student._id),
    tripId: String(trip._id),
    remainingPoints: updated.ridePoints,
  });

  if (updated.ridePoints <= 2) {
    void notifyLowBalance({
      studentId: String(student._id),
      remainingPoints: updated.ridePoints,
    });
  }

  return {
    ok: true,
    message: "Ride deducted",
    studentName: student.fullName,
    remainingPoints: updated.ridePoints,
    tripId: String(trip._id),
  };
};
