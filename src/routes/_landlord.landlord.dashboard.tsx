import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, Clock, TrendingUp, Plus, UserPlus, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/_landlord/landlord/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MyTenant" }] }),
  component: LandlordDashboard,
});

const stats = [
  { label: "Total properties", value: "12", icon: Building2 },
  { label: "Total tenants", value: "38", icon: Users },
  { label: "Pending approvals", value: "4", icon: Clock, accent: true },
  { label: "This month", value: formatCurrency(2_400_000), icon: TrendingUp },
];

const activity = [
  { who: "Chinedu A.", what: "submitted payment proof", when: "2h ago", amount: 75000 },
  { who: "Aisha M.", what: "submitted payment proof", when: "5h ago", amount: 120000 },
  { who: "Tunde O.", what: "approved by you", when: "Yesterday", amount: 95000 },
  { who: "Grace I.", what: "rent reminder sent", when: "Yesterday" },
  { who: "Kemi A.", what: "receipt generated", when: "2 days ago", amount: 60000 },
];

function LandlordDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening across your properties.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-4 lg:p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.accent ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary"}`}>
                <s.icon className="h-4.5 w-4.5" />
              </span>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent activity</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/landlord/notifications">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {activity.map((a, i) => (
              <li key={i} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                    {a.who[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate"><span className="font-medium">{a.who}</span> {a.what}</p>
                    <p className="text-xs text-muted-foreground">{a.when}</p>
                  </div>
                </div>
                {a.amount && <span className="text-sm font-medium ml-3">{formatCurrency(a.amount)}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-semibold mb-4">Quick actions</h2>
          <div className="space-y-2">
            <QuickAction to="/landlord/properties" icon={Plus} label="Add property" />
            <QuickAction to="/landlord/tenants" icon={UserPlus} label="Invite tenant" />
            <QuickAction to="/landlord/payments/review" icon={FileCheck} label="Review payments" badge="4" />
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  badge,
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
      {badge && <span className="text-[10px] font-semibold rounded-full bg-accent text-accent-foreground px-2 py-0.5">{badge}</span>}
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
