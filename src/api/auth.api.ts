import { mockDelay } from "./axiosClient";
import type { User, UserRole } from "@/store/authStore";

const makeToken = (role: UserRole) =>
  `mock.${btoa(JSON.stringify({ role, exp: Date.now() + 3600_000 }))}.sig`;

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  async login(email: string, _password: string): Promise<LoginResponse> {
    await mockDelay();
    const role: UserRole = email.toLowerCase().startsWith("tenant") ? "tenant" : "landlord";
    const user: User = {
      id: "u_" + Math.random().toString(36).slice(2, 8),
      name: role === "tenant" ? "Tenant Demo" : "Landlord Demo",
      email,
      role,
    };
    return { user, token: makeToken(role) };
  },

  async signupLandlord(data: { fullName: string; email: string; phone: string; password: string }): Promise<LoginResponse> {
    await mockDelay();
    const user: User = {
      id: "u_" + Math.random().toString(36).slice(2, 8),
      name: data.fullName,
      email: data.email,
      role: "landlord",
    };
    return { user, token: makeToken("landlord") };
  },

  async googleLogin(_credential: string): Promise<LoginResponse> {
    await mockDelay(400);
    const user: User = {
      id: "u_google",
      name: "Google User",
      email: "google.user@example.com",
      role: "landlord",
    };
    return { user, token: makeToken("landlord") };
  },

  async verifyInviteToken(token: string) {
    await mockDelay(400);
    if (!token || token.length < 4) throw { message: "Invalid or expired invite link" };
    return {
      email: "newtenant@example.com",
      propertyName: "Sunshine Apartments — Unit 4B",
      landlordName: "Adaeze Okafor",
      monthlyRent: 75000,
      currency: "NGN",
    };
  },

  async registerTenantViaInvite(_token: string, data: { fullName: string; password: string }): Promise<LoginResponse> {
    await mockDelay();
    const user: User = {
      id: "u_" + Math.random().toString(36).slice(2, 8),
      name: data.fullName,
      email: "newtenant@example.com",
      role: "tenant",
    };
    return { user, token: makeToken("tenant") };
  },

  async forgotPassword(_email: string) {
    await mockDelay();
    return { ok: true };
  },

  async logout() {
    await mockDelay(150);
    return { ok: true };
  },
};
