import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/stores/auth";

// In production the Next.js rewrite proxies /api/v1/* to the real backend,
// so the browser never makes a cross-origin HTTP request (avoids mixed-content).
// In development we still hit the backend directly for faster feedback.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const isServer = typeof window === "undefined";
const useDirectUrl = process.env.NODE_ENV !== "production" || isServer;
const baseURL = useDirectUrl ? `${API_URL}/api/v1` : "/api/v1";

export const API_BASE = API_URL;

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const store = useAuthStore.getState();
  if (!store.refreshToken) return null;
  try {
    const refreshUrl = useDirectUrl
      ? `${API_URL}/api/v1/auth/refresh`
      : "/api/v1/auth/refresh";
    const { data } = await axios.post(refreshUrl, {
      refresh_token: store.refreshToken,
    });
    store.setTokens(data.access_token, data.refresh_token);
    return data.access_token as string;
  } catch {
    store.clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      original._retry = true;
      refreshing = refreshing || refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}
