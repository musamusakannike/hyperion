import type { RequestHandler } from "express";
import { DriverDevice } from "../models/driver-device.model";
import { Trip } from "../models/trip.model";
import { User } from "../models/user.model";
import { createStudentPaystackAccount } from "../services/paystack.service";
import { adminAdjustPoints } from "../services/wallet.service";
import { AppError } from "../utils/app-error";
import { assertPinFormat, hashSecret, randomToken } from "../utils/crypto";

const studentSelect = "fullName email matricNumber role ridePoints leftoverKobo dedicatedAccount rfidUid isActive createdAt";

export const stats: RequestHandler = async (_request, response, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [students, drivers, ridesToday, successfulRides] = await Promise.all([
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ role: "driver", isActive: true }),
      Trip.countDocuments({ status: "success", createdAt: { $gte: startOfDay } }),
      Trip.countDocuments({ status: "success" }),
    ]);

    response.json({ students, drivers, ridesToday, successfulRides });
  } catch (error) {
    next(error);
  }
};

export const listUsers: RequestHandler = async (request, response, next) => {
  try {
    const role = request.query.role as string | undefined;
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select(studentSelect).sort({ createdAt: -1 }).limit(200);
    response.json({ users });
  } catch (error) {
    next(error);
  }
};

export const createStudent: RequestHandler = async (request, response, next) => {
  try {
    const { email, password, fullName, matricNumber, pin } = request.body as Record<string, string>;
    if (!email || !password || !fullName || !matricNumber || !pin) {
      throw new AppError("email, password, fullName, matricNumber and pin are required");
    }
    assertPinFormat(pin);

    const paystack = await createStudentPaystackAccount(email, fullName);
    const user = await User.create({
      role: "student",
      email,
      passwordHash: await hashSecret(password),
      fullName,
      matricNumber: matricNumber.toUpperCase(),
      pinHash: await hashSecret(pin),
      qrToken: randomToken(),
      paystackCustomerCode: paystack?.customerCode,
      dedicatedAccount: paystack?.dedicatedAccount,
    });
    response.status(201).json({ user: await User.findById(user._id).select(studentSelect) });
  } catch (error) {
    next(error);
  }
};

export const createDriver: RequestHandler = async (request, response, next) => {
  try {
    const { email, password, fullName } = request.body as Record<string, string>;
    if (!email || !password || !fullName) {
      throw new AppError("email, password and fullName are required");
    }
    const user = await User.create({
      role: "driver",
      email,
      passwordHash: await hashSecret(password),
      fullName,
    });
    response.status(201).json({ user: await User.findById(user._id).select(studentSelect) });
  } catch (error) {
    next(error);
  }
};

export const updateUser: RequestHandler = async (request, response, next) => {
  try {
    const { fullName, isActive, email } = request.body as {
      fullName?: string;
      isActive?: boolean;
      email?: string;
    };
    const user = await User.findByIdAndUpdate(
      request.params.id,
      { ...(fullName ? { fullName } : {}), ...(email ? { email } : {}), ...(typeof isActive === "boolean" ? { isActive } : {}) },
      { new: true },
    ).select(studentSelect);
    if (!user) throw new AppError("User not found", 404);
    response.json({ user });
  } catch (error) {
    next(error);
  }
};

export const bindRfid: RequestHandler = async (request, response, next) => {
  try {
    const { rfidUid } = request.body as { rfidUid?: string };
    if (!rfidUid) throw new AppError("rfidUid is required");
    const taken = await User.findOne({ rfidUid, _id: { $ne: request.params.id } });
    if (taken) throw new AppError("This RFID card is already bound to another student", 409);
    const user = await User.findByIdAndUpdate(request.params.id, { rfidUid }, { new: true }).select(studentSelect);
    if (!user) throw new AppError("Student not found", 404);
    response.json({ user });
  } catch (error) {
    next(error);
  }
};

export const unbindRfid: RequestHandler = async (request, response, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      request.params.id,
      { $unset: { rfidUid: 1 } },
      { new: true },
    ).select(studentSelect);
    if (!user) throw new AppError("Student not found", 404);
    response.json({ user });
  } catch (error) {
    next(error);
  }
};

export const rotateQr: RequestHandler = async (request, response, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      request.params.id,
      { qrToken: randomToken() },
      { new: true },
    ).select(studentSelect);
    if (!user) throw new AppError("Student not found", 404);
    response.json({ message: "QR token rotated. Student must open the app again to see the new code." });
  } catch (error) {
    next(error);
  }
};

export const adjustPoints: RequestHandler = async (request, response, next) => {
  try {
    const { deltaPoints, note } = request.body as { deltaPoints?: number; note?: string };
    if (typeof deltaPoints !== "number" || !Number.isInteger(deltaPoints)) {
      throw new AppError("deltaPoints must be an integer (positive or negative)");
    }
    const result = await adminAdjustPoints({ userId: request.params.id as string, deltaPoints, note });
    response.json(result);
  } catch (error) {
    next(error);
  }
};

export const listTrips: RequestHandler = async (request, response, next) => {
  try {
    const { driverId, studentId, status } = request.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (driverId) filter.driverId = driverId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;
    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("studentId", "fullName matricNumber")
      .populate("driverId", "fullName");
    response.json({ trips });
  } catch (error) {
    next(error);
  }
};

export const createDriverDevice: RequestHandler = async (request, response, next) => {
  try {
    const { driverId, deviceLabel } = request.body as { driverId?: string; deviceLabel?: string };
    if (!driverId || !deviceLabel) throw new AppError("driverId and deviceLabel are required");
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "driver") throw new AppError("Driver not found", 404);

    const apiKey = `hypd_${randomToken(24)}`;
    const device = await DriverDevice.create({
      driverId,
      deviceLabel,
      apiKeyHash: await hashSecret(apiKey),
      apiKeyPrefix: apiKey.slice(0, 8),
    });

    response.status(201).json({
      device: { id: device.id, driverId, deviceLabel, apiKeyPrefix: device.apiKeyPrefix },
      apiKey,
      warning: "Store this API key now. It will not be shown again.",
    });
  } catch (error) {
    next(error);
  }
};
