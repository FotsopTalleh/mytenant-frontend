import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notificationsApi } from "@/api";
import type { AppNotification } from "@/api";
import { useNotificationStore } from "@/store/notificationStore";
import { formatDate } from "@/utils/format";

export const Route = createFileRoute("/_landlord/landlord/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MyTenant" }] }),
  component: NotificationsPage,
});

// ── Icon / colour per notification type ──────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  PAYMENT_SUBMITTED: { label: "Payment submitted", color: "bg-warning/15 text-warning" },
  PAYMENT_APPROVED:  { label: "Payment approved",  color: "bg-success/15 text-success"  },
  PAYMENT_REJECTED:  { label: "Rejected",          color: "bg-destructive/15 text-destructive" },
  RENT_REMINDER:     { label: "Rent reminder",     color: "bg-primary/15 text-primary"  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? { label: type, color: "bg-muted text-muted-foreground" };
}

// ── Page component ────────────────────────────────────────────────────────────

function NotificationsPage() {
  const qc         = useQueryClient();
  const setItems   = useNotificationStore((s) => s.setItems);
  const markRead   = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const notifsQ = useQuery({
    queryKey: ["notifications"],
    queryFn:  () => notificationsApi.list({ limit: 50 }),
    staleTime: 30_000,
  });

  const notifications: AppNotification[] =
    (notifsQ.data as { data?: AppNotification[] } | undefined)?.data ?? [];

  // Sync API results into the Zustand store (drives unread badge in sidebar)
  useEffect(() => {
    if (notifications.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItems(notifications as any);
    }
  }, [notifications, setItems]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Mark single read ───────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: (_data, id) => {
      markRead(id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to mark as read"),
  });

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      markAllRead();
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read.");
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to mark all read"),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stay on top of approvals and tenant activity.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            {markAllMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <CheckCheck className="h-4 w-4" />
            }
            Mark all read
          </Button>
        )}
      </div>

      {/* Unread summary */}
      {unreadCount > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <Bell className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            You have <span className="font-semibold text-primary">{unreadCount}</span> unread notification{unreadCount !== 1 ? "s" : ""}.
          </p>
        </div>
      )}

      {/* List */}
      {notifsQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                isMarkingRead={markReadMutation.isPending && markReadMutation.variables === n.id}
                onMarkRead={() => !n.read && markReadMutation.mutate(n.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NotificationRow({
  notification: n, isMarkingRead, onMarkRead,
}: {
  notification: AppNotification;
  isMarkingRead: boolean;
  onMarkRead: () => void;
}) {
  const cfg = getConfig(n.type);

  return (
    <li
      className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-muted/30 ${
        !n.read ? "bg-primary/4" : ""
      }`}
      onClick={onMarkRead}
    >
      {/* Type dot */}
      <div className="mt-0.5 shrink-0">
        <span
          className={`inline-flex h-8 w-8 rounded-full items-center justify-center text-xs font-semibold ${cfg.color}`}
        >
          <Bell className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-medium ${!n.read ? "text-foreground" : "text-foreground/80"}`}>
            {n.title}
          </p>
          {!n.read && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
          <Badge variant="outline" className={`rounded-full text-[10px] px-2 py-0 ${cfg.color} border-transparent`}>
            {cfg.label}
          </Badge>
        </div>
      </div>

      {/* Mark read indicator */}
      <div className="shrink-0 mt-1">
        {isMarkingRead ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : !n.read ? (
          <div className="h-4 w-4 rounded-full border-2 border-primary" />
        ) : (
          <div className="h-4 w-4 rounded-full bg-muted" />
        )}
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <BellOff className="h-7 w-7" />
      </div>
      <h3 className="font-semibold">All quiet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        No notifications yet. You'll be alerted when tenants submit payment proofs.
      </p>
    </div>
  );
}
