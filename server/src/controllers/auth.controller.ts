import type { RequestHandler } from "express";
import { User } from "../models/user.model";
import { createStudentPaystackAccount } from "../services/paystack.service";
import { isValidPushToken, notifyPinChanged, sendPushNotification } from "../services/notification.service";
import { AppError } from "../utils/app-error";
import { assertPinFormat, hashSecret, verifySecret } from "../utils/crypto";
import { signAccessToken } from "../utils/jwt";

const publicUser = (user: {
  id: string;
  role: string;
  email: string;
  fullName: string;
  matricNumber?: string | null;
  ridePoints: number;
  leftoverKobo?: number;
  dedicatedAccount?: { bankName?: string; accountNumber?: string; accountName?: string };
  rfidUid?: string | null;
  isActive: boolean;
}) => ({
  id: user.id,
  role: user.role,
  email: user.email,
  fullName: user.fullName,
  matricNumber: user.matricNumber,
  ridePoints: user.ridePoints,
  leftoverKobo: user.leftoverKobo ?? 0,
  dedicatedAccount: user.dedicatedAccount,
  hasRfid: Boolean(user.rfidUid),
  isActive: user.isActive,
});

export const registerStudent: RequestHandler = async (request, response, next) => {
  try {
    const { email, password, fullName, matricNumber, pin, pushToken } = request.body as {
      email?: string;
      password?: string;
      fullName?: string;
      matricNumber?: string;
      pin?: string;
      pushToken?: string;
    };

    if (!email || !password || !fullName || !matricNumber || !pin) {
      throw new AppError("email, password, fullName, matricNumber and pin are required");
    }
    assertPinFormat(pin);
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters");
    }

    const exists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { matricNumber: matricNumber.toUpperCase() }],
    });
    if (exists) {
      throw new AppError("Email or matric number already registered", 409);
    }

    const paystack = await createStudentPaystackAccount(email, fullName);

    const user = await User.create({
      role: "student",
      email,
      passwordHash: await hashSecret(password),
      fullName,
      matricNumber: matricNumber.toUpperCase(),
      pinHash: await hashSecret(pin),
      paystackCustomerCode: paystack?.customerCode,
      dedicatedAccount: paystack?.dedicatedAccount,
      pushTokens: pushToken && isValidPushToken(pushToken) ? [pushToken] : [],
    });

    const token = signAccessToken(user.id, user.role);
    response.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (request, response, next) => {
  try {
    const { email, password, pushToken } = request.body as {
      email?: string;
      password?: string;
      pushToken?: string;
    };
    if (!email || !password) {
      throw new AppError("email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !(await verifySecret(password, user.passwordHash))) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    if (!user.isActive) {
      throw new AppError("Account is disabled", 403, "DISABLED");
    }

    if (pushToken && isValidPushToken(pushToken)) {
      await User.findByIdAndUpdate(user.id, { $addToSet: { pushTokens: pushToken } });
    }

    const token = signAccessToken(user.id, user.role);
    response.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (request, response, next) => {
  try {
    const user = await User.findById(request.user!.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

export const changePin: RequestHandler = async (request, response, next) => {
  try {
    const { currentPin, newPin } = request.body as { currentPin?: string; newPin?: string };
    if (!currentPin || !newPin) {
      throw new AppError("currentPin and newPin are required");
    }
    assertPinFormat(newPin);

    const user = await User.findById(request.user!.id).select("+pinHash");
    if (!user || user.role !== "student") {
      throw new AppError("Only students have a ride PIN", 403);
    }
    if (!user.pinHash || !(await verifySecret(currentPin, user.pinHash))) {
      throw new AppError("Current PIN is incorrect", 401, "BAD_PIN");
    }

    user.pinHash = await hashSecret(newPin);
    await user.save();

    void notifyPinChanged(user.id);

    response.json({ message: "PIN updated" });
  } catch (error) {
    next(error);
  }
};

export const registerPushToken: RequestHandler = async (request, response, next) => {
  try {
    const { pushToken } = request.body as { pushToken?: string };
    if (!pushToken || !isValidPushToken(pushToken)) {
      throw new AppError("A valid Expo push token is required", 400);
    }
    await User.findByIdAndUpdate(request.user!.id, { $addToSet: { pushTokens: pushToken } });
    response.json({ message: "Push token registered successfully" });
  } catch (error) {
    next(error);
  }
};

export const removePushToken: RequestHandler = async (request, response, next) => {
  try {
    const { pushToken } = request.body as { pushToken?: string };
    if (pushToken) {
      await User.findByIdAndUpdate(request.user!.id, { $pull: { pushTokens: pushToken } });
    }
    response.json({ message: "Push token removed successfully" });
  } catch (error) {
    next(error);
  }
};

export const testPushNotification: RequestHandler = async (request, response, next) => {
  try {
    const user = await User.findById(request.user!.id);
    if (!user) throw new AppError("User not found", 404);

    const result = await sendPushNotification(user.id, {
      title: "Hyperion Notifications Active 🚀",
      body: `Hello ${user.fullName}, push notifications are working properly on your device!`,
      data: { type: "TEST_NOTIFICATION" },
    });

    response.json({ message: "Test notification dispatched", ...result });
  } catch (error) {
    next(error);
  }
};
