import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle, CloudUpload, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/format";
import { tenantsApi, paymentsApi } from "@/api";
import type { Payment } from "@/api";
import { useAuthStore } from "@/store/authStore";
import { PaymentCalendar } from "@/components/payments/PaymentCalendar";


export const Route = createFileRoute("/_tenant/tenant/dashboard")({
  head: () => ({ meta: [{ title: "Home — MyTenant" }] }),
  component: TenantDashboard,
});

function TenantDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "";

  // Tenant record: rent amount + due day
  const tenantQ = useQuery({
    queryKey: ["tenant", "me"],
    queryFn:  () => tenantsApi.me(),
    retry: false, // 404 = no tenant record; don't retry indefinitely
  });

  // Recent payments (last 6)
  const paymentsQ = useQuery({
    queryKey: ["payments", "my", "recent"],
    queryFn:  () => paymentsApi.list({ limit: 6 }),
  });

  const tenant  = tenantQ.data;
  const payments: Payment[] = (paymentsQ.data as { data?: Payment[] } | undefined)?.data ?? [];

  // The most recent pending submission
  const lastPending = payments.find((p) => p.status === "pending");

  if (tenantQ.isLoading || paymentsQ.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Hi{firstName ? `, ${firstName}` : " there"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your rent at a glance.</p>
      </header>

      {/* ── Rent card ─────────────────────────────────────────────────────── */}
      {tenant ? (
        <section className="rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-elevated">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Monthly rent</p>
              <p className="mt-1 text-3xl font-bold">{formatCurrency(tenant.monthlyRent)}</p>
              <p className="mt-1 text-sm opacity-90">
                Due on day {tenant.rentDueDay} of each month
              </p>
            </div>
            <span className="text-[11px] font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full shrink-0">
              {lastPending ? "Under review" : tenant.status === "active" ? "Active" : tenant.status}
            </span>
          </div>
          <Button asChild size="lg" variant="secondary" className="w-full mt-5 rounded-xl gap-2 h-12">
            <Link to="/tenant/upload">
              <CloudUpload className="h-4 w-4" /> Upload payment proof
            </Link>
          </Button>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No active tenancy found. Make sure you registered using your landlord's invitation link.
          </p>
        </section>
      )}

      {/* ── Last pending submission ────────────────────────────────────────── */}
      {lastPending && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Last submission</h2>
            <span className="text-[11px] font-semibold bg-warning/15 text-warning px-2 py-0.5 rounded-full">
              Under review
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(lastPending.amountClaimed)} · Submitted {formatDate(lastPending.submittedAt)}
          </p>
        </section>
      )}

      {/* ── Payment history ───────────────────────────────────────────────── */}
      {payments.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent payments</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs">
              <Link to="/tenant/payments">
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
          <ol className="space-y-3">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <StatusDot status={p.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{formatDate(p.submittedAt)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(p.amountClaimed)}</p>
                </div>
                <span
                  className={`text-xs font-medium shrink-0 ${
                    p.status === "approved"
                      ? "text-success"
                      : p.status === "rejected"
                        ? "text-destructive"
                        : "text-warning"
                  }`}
                >
                  {p.status === "approved" ? "Approved" : p.status === "rejected" ? "Rejected" : "Pending"}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No payments submitted yet. Upload your first proof above.
          </p>
        </section>
      )}
      {/* ── 12-month Payment Calendar ──────────────────────────────────────── */}
      <PaymentCalendar />

    </div>
  );
}

function StatusDot({ status }: { status: "approved" | "pending" | "rejected" }) {
  const Icon = status === "approved" ? CheckCircle2 : status === "rejected" ? XCircle : Clock;
  const cls  =
    status === "approved"
      ? "bg-success/15 text-success"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive"
        : "bg-warning/15 text-warning";
  return (
    <span className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}
