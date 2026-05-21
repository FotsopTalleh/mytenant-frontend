// ─── axiosClient.ts — Real Flask backend client ───────────────────────────────
// Handles: auth header injection, silent token refresh on 401, withCredentials
// for httpOnly refresh cookie.

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

// ── Base URL ─────────────────────────────────────────────────────────────────
// In dev  : Vite proxy forwards /api/* → http://localhost:5000/*
// In prod : set VITE_API_URL to your deployed Flask URL
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Required for httpOnly refresh_token cookie
});

// ── Request interceptor — attach access token ─────────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Silent refresh logic ──────────────────────────────────────────────────────
let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

function _onRefreshed(newToken: string) {
  _refreshQueue.forEach((cb) => cb(newToken));
  _refreshQueue = [];
}

async function _refreshAccessToken(): Promise<string> {
  const res = await axios.post<{ data: { accessToken: string } }>(
    `${BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  return res.data.data.accessToken;
}

// ── Response interceptor — handle 401, retry once after refresh ───────────────
axiosClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ error?: { message?: string; code?: string; field?: string } }>) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Silent refresh: 401 on any request that hasn't been retried yet.
    // IMPORTANT: Never attempt a refresh when the failing request itself is an
    // auth endpoint — a login 401 means wrong credentials, not an expired session.
    const url = original.url ?? "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/google") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password") ||
      url.includes("/auth/invite");

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      if (_isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve) => {
          _refreshQueue.push((token) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(axiosClient(original));
          });
        });
      }

      _isRefreshing = true;
      try {
        const newToken = await _refreshAccessToken();
        useAuthStore.getState().setAccessToken(newToken);
        _onRefreshed(newToken);
        _isRefreshing = false;
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return axiosClient(original);
      } catch {
        // Refresh failed — force logout
        _isRefreshing = false;
        _refreshQueue = [];
        useAuthStore.getState().logout();
        return Promise.reject({ message: "Session expired. Please log in again.", code: "AUTH_SESSION_EXPIRED" });
      }
    }

    // Normalise error shape to match backend envelope
    const data = error.response?.data?.error;
    return Promise.reject({
      message: data?.message ?? error.message ?? "Something went wrong",
      code: data?.code,
      field: data?.field,
    });
  }
);
