"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

export function Guard({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!roles.includes(user.role)) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "driver") router.replace("/driver");
      else router.replace("/student");
    }
  }, [loading, user, roles, router]);

  if (loading || !user || !roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app text-zinc-400">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
