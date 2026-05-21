import { axiosClient } from "./axiosClient";
import type { PaginatedResponse } from "./properties.api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  userId: string;
  landlordId: string;
  propertyId: string;
  monthlyRent: number;
  rentDueDay: number;
  status: "active" | "removed";
  createdAt: string;
  updatedAt: string;
  /** Enriched by the backend list endpoint — present when fetched by a landlord */
  fullName?: string;
  email?: string;
}

export interface InviteBody {
  email: string;
  propertyId: string;
  monthlyRent: number;
  rentDueDay: number;
}

export interface InviteResult {
  invitationId: string;
  /** Only present in development mode */
  inviteToken?: string;
  inviteUrl?: string;
}

// ── Tenants API ───────────────────────────────────────────────────────────────

export const tenantsApi = {

  /** Tenant: fetch own record (monthlyRent, rentDueDay, propertyId, etc.) */
  async me(): Promise<Tenant> {
    const { data } = await axiosClient.get<{ data: { tenant: Tenant } }>("/tenants/me");
    return data.data.tenant;
  },

  async list(params?: {
    page?: number;
    limit?: number;
    propertyId?: string;
    status?: string;
  }): Promise<PaginatedResponse<Tenant>> {
    const { data } = await axiosClient.get<PaginatedResponse<Tenant>>("/tenants", { params });
    return data;
  },

  async get(id: string): Promise<{ tenant: Tenant; user: Record<string, unknown>; recentPayments: unknown[] }> {
    const { data } = await axiosClient.get<{ data: { tenant: Tenant; user: Record<string, unknown>; recentPayments: unknown[] } }>(
      `/tenants/${id}`
    );
    return data.data;
  },

  async invite(body: InviteBody): Promise<InviteResult> {
    const { data } = await axiosClient.post<{ data: InviteResult }>("/tenants/invite", body);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(`/tenants/${id}`);
  },
};
