import { env } from "../config/env.config";
import { Ledger } from "../models/ledger.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/app-error";

export const creditFromDeposit = async (params: {
  userId: string;
  amountKobo: number;
  paystackReference: string;
}): Promise<{ pointsAdded: number; ridePoints: number; leftoverKobo: number }> => {
  const existing = await Ledger.findOne({ paystackReference: params.paystackReference });
  if (existing) {
    const user = await User.findById(params.userId);
    return {
      pointsAdded: 0,
      ridePoints: user?.ridePoints ?? 0,
      leftoverKobo: user?.leftoverKobo ?? 0,
    };
  }

  const user = await User.findById(params.userId);
  if (!user) {
    throw new AppError("Student not found for deposit", 404);
  }

  const totalKobo = (user.leftoverKobo ?? 0) + params.amountKobo;
  const pointsAdded = Math.floor(totalKobo / env.ridePriceKobo);
  const leftoverKobo = totalKobo % env.ridePriceKobo;

  user.ridePoints += pointsAdded;
  user.leftoverKobo = leftoverKobo;
  await user.save();

  await Ledger.create({
    userId: user._id,
    deltaPoints: pointsAdded,
    leftoverKoboAfter: leftoverKobo,
    reason: "deposit",
    paystackReference: params.paystackReference,
  });

  return { pointsAdded, ridePoints: user.ridePoints, leftoverKobo };
};

export const adminAdjustPoints = async (params: {
  userId: string;
  deltaPoints: number;
  note?: string;
}): Promise<{ ridePoints: number }> => {
  const user = await User.findById(params.userId);
  if (!user || user.role !== "student") {
    throw new AppError("Student not found", 404);
  }

  const next = user.ridePoints + params.deltaPoints;
  if (next < 0) {
    throw new AppError("Adjustment would make points negative", 400);
  }

  user.ridePoints = next;
  await user.save();
  await Ledger.create({
    userId: user._id,
    deltaPoints: params.deltaPoints,
    leftoverKoboAfter: user.leftoverKobo,
    reason: "admin_adjust",
    note: params.note,
  });

  return { ridePoints: user.ridePoints };
};
