import { create } from "zustand";

export interface AppNotification {
  id: string;
  type: "PAYMENT_SUBMITTED" | "PAYMENT_APPROVED" | "PAYMENT_REJECTED" | "RENT_REMINDER";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  items: AppNotification[];
  pushPermission: NotificationPermission | "default";
  bannerDismissed: boolean;
  setItems: (items: AppNotification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setPermission: (p: NotificationPermission) => void;
  dismissBanner: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  pushPermission: "default",
  bannerDismissed: false,
  setItems: (items) => set({ items }),
  markRead: (id) =>
    set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
  markAllRead: () => set({ items: get().items.map((n) => ({ ...n, read: true })) }),
  setPermission: (p) => set({ pushPermission: p }),
  dismissBanner: () => set({ bannerDismissed: true }),
  unreadCount: () => get().items.filter((n) => !n.read).length,
}));
