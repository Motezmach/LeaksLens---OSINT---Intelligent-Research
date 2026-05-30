"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/types";

export function useAuth() {
  const router = useRouter();
  const { setTokens, setUser, clear, user, accessToken } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const { data } = await api.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setTokens(data.access_token, data.refresh_token);
      const me = await api.get<User>("/auth/me");
      setUser(me.data);
      return me.data;
    },
    [setTokens, setUser]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      fullName?: string,
      inviteCode?: string
    ) => {
      await api.post("/auth/register", {
        email,
        password,
        full_name: fullName || null,
        invite_code: inviteCode || null,
      });
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    clear();
    router.push("/login");
  }, [clear, router]);

  return { user, accessToken, login, register, logout, setUser };
}
