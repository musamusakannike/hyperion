import type { RequestHandler } from "express";
import { SCAN_METHODS } from "../models/trip.model";
import { Trip } from "../models/trip.model";
import { performScan } from "../services/scan.service";
import { AppError } from "../utils/app-error";

export const createScan: RequestHandler = async (request, response, next) => {
  try {
    const { method, token, pin, requestId } = request.body as {
      method?: string;
      token?: string;
      pin?: string;
      requestId?: string;
    };

    if (!method || !SCAN_METHODS.includes(method as (typeof SCAN_METHODS)[number])) {
      throw new AppError('method must be "qr" or "rfid"');
    }
    if (!token) {
      throw new AppError("token is required (QR payload or RFID UID)");
    }

    const result = await performScan({
      driverId: request.user!.id,
      method: method as "qr" | "rfid",
      token,
      pin,
      requestId,
    });

    response.status(result.ok ? 200 : 402).json(result);
  } catch (error) {
    next(error);
  }
};

export const listDriverTrips: RequestHandler = async (request, response, next) => {
  try {
    const trips = await Trip.find({ driverId: request.user!.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("studentId", "fullName matricNumber");
    response.json({ trips });
  } catch (error) {
    next(error);
  }
};
