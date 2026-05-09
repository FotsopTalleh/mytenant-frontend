import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";

export const axiosClient = axios.create({
  baseURL: "/api/mock",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ message?: string; code?: string; field?: string }>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    const data = error.response?.data;
    return Promise.reject({
      message: data?.message || error.message || "Something went wrong",
      code: data?.code,
      field: data?.field,
    });
  },
);

// Mock latency helper for offline frontend-only mode
export const mockDelay = (ms = 600) => new Promise((res) => setTimeout(res, ms));
