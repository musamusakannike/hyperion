import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { env } from "../config/env.config";
import { User } from "../models/user.model";

const expo = new Expo({
  accessToken: env.expoAccessToken || undefined,
});

export type PushNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

/**
 * Validate whether a token is a valid Expo push token format.
 */
export const isValidPushToken = (token: string): boolean => {
  return Expo.isExpoPushToken(token);
};

/**
 * Low-level sender to direct tokens.
 */
export const sendToTokens = async (
  tokens: string[],
  payload: PushNotificationPayload,
): Promise<{ success: boolean; sentCount: number }> => {
  try {
    const validTokens = Array.from(new Set(tokens)).filter((t) => Expo.isExpoPushToken(t));
    if (validTokens.length === 0) {
      return { success: true, sentCount: 0 };
    }

    const messages: ExpoPushMessage[] = validTokens.map((to) => ({
      to,
      sound: payload.sound ?? "default",
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];
          if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
            const deadToken = chunk[i]?.to;
            if (typeof deadToken === "string") {
              await User.updateMany({ pushTokens: deadToken }, { $pull: { pushTokens: deadToken } }).catch(
                () => {},
              );
            }
          }
        }
      } catch (chunkError) {
        console.error("[NotificationService] Error sending chunk:", chunkError);
      }
    }

    return { success: true, sentCount: validTokens.length };
  } catch (error) {
    console.error("[NotificationService] Failed to send push to tokens:", error);
    return { success: false, sentCount: 0 };
  }
};

/**
 * Send notification to one or multiple users by user ID.
 */
export const sendPushNotification = async (
  userIds: string | string[],
  payload: PushNotificationPayload,
): Promise<{ success: boolean; sentCount: number }> => {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return { success: true, sentCount: 0 };

    const users = await User.find({ _id: { $in: ids }, isActive: true }).select("+pushTokens");
    const allTokens: string[] = [];

    for (const user of users) {
      const tokens = (user as unknown as { pushTokens?: string[] }).pushTokens;
      if (Array.isArray(tokens)) {
        allTokens.push(...tokens);
      }
    }

    if (allTokens.length === 0) {
      return { success: true, sentCount: 0 };
    }

    return await sendToTokens(allTokens, payload);
  } catch (error) {
    console.error("[NotificationService] Failed to send push notification:", error);
    return { success: false, sentCount: 0 };
  }
};

// ==========================================
// Specialized Event Notification Triggers
// ==========================================

export const notifyWalletCredited = async (params: {
  userId: string;
  amountKobo: number;
  pointsAdded: number;
  totalPoints: number;
}) => {
  const formattedNaira = (params.amountKobo / 100).toLocaleString();
  return sendPushNotification(params.userId, {
    title: "Wallet Credited! 💳",
    body: `₦${formattedNaira} deposited! +${params.pointsAdded} ride point(s) added. Balance: ${params.totalPoints} pts.`,
    data: {
      type: "WALLET_CREDITED",
      pointsAdded: params.pointsAdded,
      balance: params.totalPoints,
      screen: "/(student)",
    },
  });
};

export const notifyRideConfirmed = async (params: {
  studentId: string;
  tripId: string;
  remainingPoints: number;
}) => {
  return sendPushNotification(params.studentId, {
    title: "Boarding Confirmed 🚌",
    body: `1 ride point deducted for shuttle boarding. Remaining: ${params.remainingPoints} pts.`,
    data: {
      type: "RIDE_CONFIRMED",
      tripId: params.tripId,
      remainingPoints: params.remainingPoints,
      screen: "/(student)/rides",
    },
  });
};

export const notifyLowBalance = async (params: {
  studentId: string;
  remainingPoints: number;
}) => {
  return sendPushNotification(params.studentId, {
    title: "Low Ride Balance ⚠️",
    body: `You have only ${params.remainingPoints} ride point(s) remaining. Tap to top up your wallet.`,
    data: {
      type: "LOW_BALANCE",
      remainingPoints: params.remainingPoints,
      screen: "/(student)/fund",
    },
  });
};

export const notifyRideFailed = async (params: {
  studentId: string;
  code?: string;
  message: string;
}) => {
  let body = `Boarding attempt rejected: ${params.message}`;
  let screen = "/(student)";

  if (params.code === "INSUFFICIENT_POINTS") {
    body = "Boarding rejected: You have 0 ride points remaining. Tap to fund your wallet.";
    screen = "/(student)/fund";
  } else if (params.code === "BAD_PIN") {
    body = "Boarding rejected: Incorrect ride PIN entered. Please check your PIN in Profile.";
    screen = "/(student)/profile";
  }

  return sendPushNotification(params.studentId, {
    title: "Boarding Rejected ❌",
    body,
    data: {
      type: "RIDE_FAILED",
      code: params.code,
      screen,
    },
  });
};

export const notifyAdminAdjustPoints = async (params: {
  userId: string;
  deltaPoints: number;
  totalPoints: number;
  note?: string;
}) => {
  const sign = params.deltaPoints > 0 ? `+${params.deltaPoints}` : `${params.deltaPoints}`;
  const noteSuffix = params.note ? ` Note: ${params.note}` : "";

  return sendPushNotification(params.userId, {
    title: "Ride Points Adjustment ⚖️",
    body: `Admin adjusted your points by ${sign} pts.${noteSuffix} New balance: ${params.totalPoints} pts.`,
    data: {
      type: "POINTS_ADJUSTED",
      deltaPoints: params.deltaPoints,
      balance: params.totalPoints,
      screen: "/(student)",
    },
  });
};

export const notifyRfidBound = async (userId: string) => {
  return sendPushNotification(userId, {
    title: "RFID Card Activated 💳",
    body: "Your campus transit RFID card has been linked. You can now tap to ride shuttles.",
    data: {
      type: "RFID_BOUND",
      screen: "/(student)/profile",
    },
  });
};

export const notifyRfidUnbound = async (userId: string) => {
  return sendPushNotification(userId, {
    title: "RFID Card Unlinked 💳",
    body: "Your campus transit RFID card has been unlinked from your account.",
    data: {
      type: "RFID_UNBOUND",
      screen: "/(student)/profile",
    },
  });
};

export const notifyQrRotated = async (userId: string) => {
  return sendPushNotification(userId, {
    title: "Ride QR Code Reset 🔄",
    body: "Your digital ride QR code has been refreshed for security. Open the app to view your new QR.",
    data: {
      type: "QR_ROTATED",
      screen: "/(student)/qr",
    },
  });
};

export const notifyPinChanged = async (userId: string) => {
  return sendPushNotification(userId, {
    title: "Ride PIN Changed 🔒",
    body: "Your 4-digit ride verification PIN was successfully updated.",
    data: {
      type: "PIN_CHANGED",
      screen: "/(student)/profile",
    },
  });
};

export const notifyAccountStatus = async (userId: string, isActive: boolean) => {
  return sendPushNotification(userId, {
    title: isActive ? "Account Re-activated ✅" : "Account Suspended ⚠️",
    body: isActive
      ? "Your Hyperion account has been activated."
      : "Your Hyperion account has been suspended. Please contact campus admin.",
    data: {
      type: "ACCOUNT_STATUS",
      isActive,
    },
  });
};
