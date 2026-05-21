import { axiosClient } from "./axiosClient";
import type { User } from "@/store/authStore";

// ── Response shapes from Flask ────────────────────────────────────────────────

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface InvitePreview {
  email: string;
  propertyName: string;
  landlordName: string;
  monthlyRent: number;
}

// ── Helper: map Flask user object → frontend User ─────────────────────────────
function mapUser(raw: Record<string, unknown>): User {
  return {
    id:        raw.id as string,
    name:      (raw.fullName ?? raw.name ?? "") as string,
    email:     raw.email as string,
    role:      raw.role as "landlord" | "tenant",
    phone:     raw.phone as string | undefined,
    avatarUrl: raw.avatarUrl as string | undefined,
  };
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {

  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await axiosClient.post<{ data: { user: Record<string, unknown>; accessToken: string } }>(
      "/auth/login",
      { email, password }
    );
    return { user: mapUser(data.data.user), accessToken: data.data.accessToken };
  },

  async signupLandlord(body: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<LoginResponse> {
    const { data } = await axiosClient.post<{ data: { user: Record<string, unknown>; accessToken: string } }>(
      "/auth/signup",
      body
    );
    return { user: mapUser(data.data.user), accessToken: data.data.accessToken };
  },

  async googleLogin(credential: string): Promise<LoginResponse> {
    const { data } = await axiosClient.post<{ data: { user: Record<string, unknown>; accessToken: string } }>(
      "/auth/google",
      { credential }
    );
    return { user: mapUser(data.data.user), accessToken: data.data.accessToken };
  },

  async verifyInviteToken(token: string): Promise<InvitePreview> {
    const { data } = await axiosClient.get<{ data: InvitePreview }>(
      `/auth/invite/${token}/verify`
    );
    return data.data;
  },

  async registerTenantViaInvite(
    token: string,
    body: { fullName: string; password: string }
  ): Promise<LoginResponse> {
    const { data } = await axiosClient.post<{ data: { user: Record<string, unknown>; accessToken: string } }>(
      `/auth/invite/${token}/complete`,
      body
    );
    return { user: mapUser(data.data.user), accessToken: data.data.accessToken };
  },

  async forgotPassword(email: string): Promise<void> {
    await axiosClient.post("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await axiosClient.post("/auth/reset-password", { token, newPassword });
  },

  async logout(): Promise<void> {
    await axiosClient.post("/auth/logout");
  },

  /** Silently refresh access token — called by axiosClient interceptor automatically */
  async refresh(): Promise<string> {
    const { data } = await axiosClient.post<{ data: { accessToken: string } }>("/auth/refresh");
    return data.data.accessToken;
  },
};
