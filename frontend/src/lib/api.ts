import axios from "axios";

const TOKEN_KEY = "hyperion_token";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://hyperion-4zp3.onrender.com",
});

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
