import { axiosClient } from "./axiosClient";
import type { PaginatedResponse } from "./properties.api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ── Notifications API ─────────────────────────────────────────────────────────

export const notificationsApi = {

  async list(params?: {
    page?: number;
    limit?: number;
    read?: boolean;
  }): Promise<PaginatedResponse<AppNotification>> {
    const { data } = await axiosClient.get<PaginatedResponse<AppNotification>>(
      "/notifications",
      { params }
    );
    return data;
  },

  async markRead(id: string): Promise<void> {
    await axiosClient.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<{ updatedCount: number }> {
    const { data } = await axiosClient.patch<{ data: { updatedCount: number } }>(
      "/notifications/read-all"
    );
    return data.data;
  },

  async subscribeFcm(fcmToken: string, deviceType: "web" | "android" | "ios" = "web"): Promise<void> {
    await axiosClient.post("/notifications/subscribe", { fcmToken, deviceType });
  },

  async unsubscribeFcm(fcmToken: string): Promise<void> {
    await axiosClient.delete("/notifications/subscribe", { data: { fcmToken } });
  },
};
