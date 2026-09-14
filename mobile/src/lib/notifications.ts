import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

const PUSH_TOKEN_KEY = "hyperion_push_token";

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let cachedPushToken: string | null = null;

export const getCachedPushToken = (): string | null => {
  return cachedPushToken;
};

/**
 * Request notification permissions, configure channels, and obtain Expo Push Token.
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (Platform.OS === "web") {
    return null;
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Hyperion Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#208AEF",
        sound: "default",
      });
    }

    if (!Device.isDevice) {
      console.log("[PushNotifications] Notice: Push notifications require a physical device on iOS.");
      // On non-physical devices, return null gracefully without crashing
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[PushNotifications] Permission not granted by user.");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    const token = tokenResponse.data;
    cachedPushToken = token;
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token).catch(() => {});
    return token;
  } catch (error) {
    console.warn("[PushNotifications] Error registering for push notifications:", error);
    return null;
  }
};

/**
 * Send push token to backend for authenticated user session.
 */
export const syncPushTokenWithServer = async (token?: string | null): Promise<boolean> => {
  const tokenToSync = token || cachedPushToken || (await AsyncStorage.getItem(PUSH_TOKEN_KEY).catch(() => null));
  if (!tokenToSync) return false;

  try {
    await api.post("/api/auth/push-token", { pushToken: tokenToSync });
    cachedPushToken = tokenToSync;
    return true;
  } catch (error) {
    console.warn("[PushNotifications] Failed to sync push token with server:", error);
    return false;
  }
};

/**
 * Unregister push token from backend on logout.
 */
export const removePushTokenFromServer = async (): Promise<void> => {
  const tokenToRemove = cachedPushToken || (await AsyncStorage.getItem(PUSH_TOKEN_KEY).catch(() => null));
  if (!tokenToRemove) return;

  try {
    await api.post("/api/auth/push-token/remove", { pushToken: tokenToRemove });
  } catch (error) {
    console.warn("[PushNotifications] Failed to remove push token from server:", error);
  }
};

/**
 * Trigger a test notification from the server for the current user.
 */
export const sendTestPushNotification = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { data } = await api.post<{ message: string; success: boolean }>("/api/auth/push-token/test");
    return { success: data.success ?? true, message: data.message ?? "Test sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send test push notification";
    return { success: false, message };
  }
};
