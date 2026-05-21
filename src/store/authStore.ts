import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "landlord" | "tenant";

export interface User {
  id: string;
  name: string;      // mapped from backend's fullName
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  // ── Actions ────────────────────────────────────────────────────────────────
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;   // called by silent refresh
  logout: () => void;
  // ── Legacy compat ──────────────────────────────────────────────────────────
  /** @deprecated use accessToken */
  token: string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,
      get token()  { return get().accessToken; },   // backward compat

      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    { name: "mytenant-auth" },
  ),
);
