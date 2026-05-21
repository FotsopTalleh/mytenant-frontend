import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Users, Clock, TrendingUp,
  Plus, UserPlus, FileCheck, ArrowRight, Loader2, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/format";
import { propertiesApi, tenantsApi, paymentsApi } from "@/api";
import type { Payment } from "@/api";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/_landlord/landlord/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MyTenant" }] }),
  component: LandlordDashboard,
});

function LandlordDashboard() {
  const user = useAuthStore((s) => s.user);

  // Use limit:1 so we only fetch one record — we only need the pagination.total
  const propertiesQ = useQuery({
    queryKey: ["properties", "count"],
    queryFn:  () => propertiesApi.list({ limit: 1 }),
  });
  const tenantsQ = useQuery({
    queryKey: ["tenants", "count"],
    queryFn:  () => tenantsApi.list({ limit: 1 }),
  });
  const pendingQ = useQuery({
    queryKey: ["payments", "pending", "count"],
    queryFn:  () => paymentsApi.list({ status: "pending", limit: 1 }),
  });
  const activityQ = useQuery({
    queryKey: ["payments", "recent"],
    queryFn:  () => paymentsApi.list({ limit: 5 }),
  });

  const propertyCount  = propertiesQ.data?.pagination?.total  ?? 0;
  const tenantCount    = tenantsQ.data?.pagination?.total     ?? 0;
  const pendingCount   = pendingQ.data?.pagination?.total     ?? 0;
  const recentPayments: Payment[] = (activityQ.data as { data?: Payment[] } | undefined)?.data ?? [];

  const isLoading =
    propertiesQ.isLoading || tenantsQ.isLoading ||
    pendingQ.isLoading   || activityQ.isLoading;

  const firstName = user?.name?.split(" ")[0] ?? "";

  const stats = [
    { label: "Total properties",  value: propertyCount, icon: Building2  },
    { label: "Total tenants",     value: tenantCount,   icon: Users       },
    { label: "Pending approvals", value: pendingCount,  icon: Clock,  accent: pendingCount > 0 },
    { label: "Recent activity",   value: recentPayments.length, icon: TrendingUp },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening across your properties.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-4 lg:p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                      s.accent
                        ? "bg-accent/20 text-accent-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <s.icon className="h-4.5 w-4.5" />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </section>

          <section className="grid lg:grid-cols-3 gap-6">
            {/* Recent activity */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent activity</h2>
                <Button asChild variant="ghost" size="sm" className="rounded-xl">
                  <Link to="/landlord/notifications">
                    View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>

              {recentPayments.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-10">
                  No payments yet. Once your tenants submit proofs, they'll appear here.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recentPayments.map((p) => {
                    const statusColor =
                      p.status === "approved"
                        ? "text-success"
                        : p.status === "rejected"
                          ? "text-destructive"
                          : "text-warning";
                    const statusLabel =
                      p.status === "approved" ? "Approved" :
                      p.status === "rejected"  ? "Rejected"  : "Pending";
                    return (
                      <li
                        key={p.id}
                        className="py-3 flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate">
                              Payment proof{" "}
                              <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(p.submittedAt)}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium ml-3 shrink-0">
                          {formatCurrency(p.amountClaimed)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-semibold mb-4">Quick actions</h2>
              <div className="space-y-2">
                <QuickAction to="/landlord/properties" icon={Plus}      label="Add property"    />
                <QuickAction to="/landlord/tenants"    icon={UserPlus}  label="Invite tenant"   />
                <QuickAction
                  to="/landlord/payments/review"
                  icon={FileCheck}
                  label="Review payments"
                  badge={pendingCount > 0 ? String(pendingCount) : undefined}
                />
              </div>

              {/* Onboarding nudge for brand-new landlords */}
              {propertyCount === 0 && (
                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/8 p-4 text-sm">
                  <p className="font-medium text-primary">Get started</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Add your first property, then invite tenants to start collecting rent digitally.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function QuickAction({
  to, icon: Icon, label, badge,
}: {
  to: string;
  icon: typeof Plus;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
    >
      <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold rounded-full bg-accent text-accent-foreground px-2 py-0.5">
          {badge}
        </span>
      )}
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
