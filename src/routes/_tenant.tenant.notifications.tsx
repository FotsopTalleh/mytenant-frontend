import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, Loader2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { notificationsApi } from "@/api";
import type { AppNotification } from "@/api";
import { formatDate } from "@/utils/format";

export const Route = createFileRoute("/_tenant/tenant/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MyTenant" }] }),
  component: NotificationsPage,
});

// ── Icon map by notification type ─────────────────────────────────────────────

function NotifIcon({ type }: { type: string }) {
  const cls = "h-5 w-5";
  if (type.includes("approved"))  return <CheckCheck className={`${cls} text-success`} />;
  if (type.includes("rejected"))  return <BellOff    className={`${cls} text-destructive`} />;
  return <Bell className={`${cls} text-primary`} />;
}

function iconBg(type: string) {
  if (type.includes("approved")) return "bg-success/10";
  if (type.includes("rejected")) return "bg-destructive/10";
  return "bg-primary/10";
}

// ── Page ──────────────────────────────────────────────────────────────────────

function NotificationsPage() {
  const qc = useQueryClient();

  const notifQ = useQuery({
    queryKey: ["notifications", "my"],
    queryFn:  () => notificationsApi.list({ limit: 50 }),
  });

  const notifications: AppNotification[] =
    (notifQ.data as { data?: AppNotification[] } | undefined)?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: ({ updatedCount }) => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      if (updatedCount > 0) toast.success(`Marked ${updatedCount} notification${updatedCount !== 1 ? "s" : ""} as read.`);
    },
    onError: () => toast.error("Failed to mark all as read."),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Approvals, rejections and reminders.</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 shrink-0"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <CheckCheck className="h-3.5 w-3.5" />
            }
            Mark all read
          </Button>
        )}
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-primary">
            <Circle className="h-2 w-2 fill-primary" />
            {unreadCount} unread
          </span>
        </p>
      )}

      {/* Content */}
      {notifQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-2xl border border-dashed border-border">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Bell className="h-7 w-7" />
          </div>
          <h3 className="font-semibold">All clear</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            You have no notifications yet. We'll alert you when your landlord reviews a payment.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer
                  ${!n.read ? "bg-primary/[0.03] hover:bg-primary/[0.06]" : "hover:bg-muted/30"}`}
                onClick={() => { if (!n.read) markRead.mutate(n.id); }}
              >
                {/* Icon */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBg(n.type)}`}>
                  <NotifIcon type={n.type} />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <Circle className="h-2 w-2 fill-primary text-primary shrink-0 mt-1.5" />
                )}
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
