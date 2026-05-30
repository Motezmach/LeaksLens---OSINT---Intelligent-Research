"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useAuthStore } from "@/stores/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        setReady(true);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router, setUser]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
