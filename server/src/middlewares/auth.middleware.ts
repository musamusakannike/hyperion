import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config";
import { DriverDevice } from "../models/driver-device.model";
import type { UserRole } from "../models/user.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/app-error";
import { verifySecret } from "../utils/crypto";

type JwtPayload = { sub: string; role: UserRole };

export const requireAuth: RequestHandler = (request, _response, next) => {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    request.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401, "UNAUTHENTICATED"));
  }
};

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      next(new AppError("You do not have permission to do this", 403, "FORBIDDEN"));
      return;
    }
    next();
  };

/** Driver JWT, or X-Device-Key for a headless RFID reader bound to a driver. */
export const requireDriver: RequestHandler = async (request, _response, next) => {
  try {
    const deviceKey = request.header("x-device-key");
    if (deviceKey) {
      const prefix = deviceKey.slice(0, 8);
      const devices = await DriverDevice.find({ apiKeyPrefix: prefix, isActive: true }).select(
        "+apiKeyHash driverId",
      );
      for (const device of devices) {
        if (await verifySecret(deviceKey, device.apiKeyHash)) {
          const driver = await User.findById(device.driverId);
          if (!driver || driver.role !== "driver" || !driver.isActive) {
            throw new AppError("Driver for this device is inactive", 403, "FORBIDDEN");
          }
          request.user = { id: driver.id, role: "driver" };
          request.driverId = driver.id;
          next();
          return;
        }
      }
      throw new AppError("Invalid device key", 401, "UNAUTHENTICATED");
    }

    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    }
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as JwtPayload;
    if (payload.role !== "driver") {
      throw new AppError("Driver access required", 403, "FORBIDDEN");
    }
    request.user = { id: payload.sub, role: payload.role };
    request.driverId = payload.sub;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Invalid or expired token", 401, "UNAUTHENTICATED"));
  }
};
