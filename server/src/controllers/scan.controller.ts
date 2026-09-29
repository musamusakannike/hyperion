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
      throw new AppError("token is required (driver QR payload or RFID UID)");
    }

    const role = request.user!.role;
    if (role !== "student" && role !== "driver") {
      throw new AppError("You cannot record a ride", 403, "FORBIDDEN");
    }

    const result = await performScan({
      actorId: request.user!.id,
      actorRole: role,
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

/**
 * Lightweight polling feed for headless bus readers (ESP32).
 * The reader polls this with its X-Device-Key to announce QR boardings
 * (which happen phone-to-server and otherwise bypass the reader hardware).
 *
 * GET /api/scans/feed?since=<tripId>&limit=5
 * - `since`: only trips newer than this Trip _id are returned.
 *   Omit on boot; the server returns the latest trip so the device can
 *   baseline `lastSeenTripId` without replaying history.
 * - Trips are returned oldest-first so the buzzer/LCD announce in order.
 */
export const getDriverFeed: RequestHandler = async (request, response, next) => {
  try {
    const rawLimit = Number(request.query.limit ?? 5);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 20) : 5;
    const since = typeof request.query.since === "string" ? request.query.since.trim() : "";
    const hasSince = since !== "" && /^[0-9a-fA-F]{24}$/.test(since);

    // With `since`: everything newer than the cursor, oldest-first.
    // Without `since` (first poll after boot): the LATEST trips, so the
    // device can baseline its cursor without replaying entire history.
    // (Sorting {_id: 1} with no cursor would return the OLDEST trips ever,
    // making the reader beep through days of old QR failures.)
    let trips;
    if (hasSince) {
      trips = await Trip.find({ driverId: request.user!.id, _id: { $gt: since } })
        .sort({ _id: 1 })
        .limit(limit)
        .populate("studentId", "fullName")
        .lean();
    } else {
      const latest = await Trip.find({ driverId: request.user!.id })
        .sort({ _id: -1 })
        .limit(limit)
        .populate("studentId", "fullName")
        .lean();
      trips = latest.reverse();
    }

    response.json({
      trips: trips.map((trip) => {
        const student =
          trip.studentId && typeof trip.studentId === "object" && "fullName" in trip.studentId
            ? (trip.studentId as unknown as { fullName?: string })
            : undefined;
        return {
          id: String(trip._id),
          method: trip.method,
          status: trip.status,
          failReason: trip.failReason ?? undefined,
          studentName: student?.fullName,
          createdAt: (trip as { createdAt?: Date }).createdAt,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};
