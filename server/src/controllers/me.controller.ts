import type { RequestHandler } from "express";
import { Trip } from "../models/trip.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { randomToken } from "../utils/crypto";

export const getWallet: RequestHandler = async (request, response, next) => {
  try {
    const user = await User.findById(request.user!.id);
    if (!user) throw new AppError("User not found", 404);
    response.json({
      ridePoints: user.ridePoints,
      leftoverKobo: user.leftoverKobo,
      dedicatedAccount: user.dedicatedAccount,
      ridePriceKobo: Number(process.env.RIDE_PRICE_KOBO ?? 25_000),
    });
  } catch (error) {
    next(error);
  }
};

export const getQr: RequestHandler = async (request, response, next) => {
  try {
    const user = await User.findById(request.user!.id).select("+qrToken");
    if (!user || user.role !== "student") {
      throw new AppError("Only students have a ride QR code", 403);
    }
    if (!user.qrToken) {
      user.qrToken = randomToken();
      await user.save();
    }
    response.json({ payload: `HYP:${user.qrToken}` });
  } catch (error) {
    next(error);
  }
};

export const getMyTrips: RequestHandler = async (request, response, next) => {
  try {
    const trips = await Trip.find({ studentId: request.user!.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("driverId", "fullName");
    response.json({ trips });
  } catch (error) {
    next(error);
  }
};
