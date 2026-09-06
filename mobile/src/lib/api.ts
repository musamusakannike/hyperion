import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "hyperion_token";
const DEFAULT_API_URL = "https://hyperion-4zp3.onrender.com";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let cachedToken: string | null = null;

export const getToken = (): string | null => {
  return cachedToken;
};

export const initToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    cachedToken = token;
    return token;
  } catch {
    return null;
  }
};

export const setToken = async (token: string | null): Promise<void> => {
  cachedToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.warn("Error updating token in storage:", err);
  }
};

api.interceptors.request.use(async (config) => {
  if (!cachedToken) {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

export const apiError = (error: unknown, fallback = "Something went wrong"): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
