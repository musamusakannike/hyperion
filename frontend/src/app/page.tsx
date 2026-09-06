"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role === "admin") router.replace("/admin");
    else if (user.role === "driver") router.replace("/driver");
    else router.replace("/student");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-app text-slate-500">Opening Hyperion…</div>
  );
}
