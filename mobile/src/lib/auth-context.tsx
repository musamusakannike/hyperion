import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { api, initToken, setToken } from "./api";
import type { User, UserRole } from "./types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    matricNumber: string;
    pin: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const homeFor = (role: UserRole): string => {
  if (role === "admin") return "/(admin)";
  if (role === "driver") return "/(driver)";
  return "/(student)";
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch {
      await setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initToken();
      if (mounted) {
        await refresh();
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ token: string; user: User }>("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      await setToken(data.token);
      setUser(data.user);
      router.replace(homeFor(data.user.role) as any);
      return data.user;
    },
    [router],
  );

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      fullName: string;
      matricNumber: string;
      pin: string;
    }) => {
      const { data } = await api.post<{ token: string; user: User }>("/api/auth/register", {
        ...payload,
        email: payload.email.trim().toLowerCase(),
      });
      await setToken(data.token);
      setUser(data.user);
      router.replace("/(student)" as any);
      return data.user;
    },
    [router],
  );

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
    router.replace("/(auth)/login" as any);
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
