import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, XCircle, CloudUpload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/_tenant/tenant/dashboard")({
  head: () => ({ meta: [{ title: "Home — MyTenant" }] }),
  component: TenantDashboard,
});

const months = [
  { label: "Oct 2025", status: "paid" as const, amount: 75000 },
  { label: "Sep 2025", status: "paid" as const, amount: 75000 },
  { label: "Aug 2025", status: "paid" as const, amount: 75000 },
  { label: "Jul 2025", status: "paid" as const, amount: 75000 },
  { label: "Jun 2025", status: "rejected" as const, amount: 75000 },
  { label: "May 2025", status: "paid" as const, amount: 75000 },
];

function TenantDashboard() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Hi there 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's your rent at a glance.</p>
      </header>

      <section className="rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-elevated">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Current rent</p>
            <p className="mt-1 text-3xl font-bold">{formatCurrency(75000)}</p>
            <p className="mt-1 text-sm opacity-90">Due 1 November 2025</p>
          </div>
          <span className="text-[11px] font-semibold bg-warning/95 text-warning-foreground px-2.5 py-1 rounded-full">
            Pending
          </span>
        </div>
        <Button asChild size="lg" variant="secondary" className="w-full mt-5 rounded-xl gap-2 h-12">
          <Link to="/tenant/upload"><CloudUpload className="h-4 w-4" /> Upload payment proof</Link>
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Last submission</h2>
          <span className="text-[11px] font-semibold bg-warning/15 text-warning px-2 py-0.5 rounded-full">Under review</span>
        </div>
        <p className="text-sm text-muted-foreground">Receipt_oct.pdf • Submitted 2 hours ago</p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Last 6 months</h2>
          <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs">
            <Link to="/tenant/payments">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
        <ol className="space-y-3">
          {months.map((m) => (
            <li key={m.label} className="flex items-center gap-3 text-sm">
              <StatusDot status={m.status} />
              <div className="flex-1">
                <p className="font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(m.amount)}</p>
              </div>
              <span className={`text-xs font-medium ${m.status === "paid" ? "text-success" : m.status === "rejected" ? "text-destructive" : "text-warning"}`}>
                {m.status === "paid" ? "Paid" : m.status === "rejected" ? "Rejected" : "Pending"}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function StatusDot({ status }: { status: "paid" | "pending" | "rejected" }) {
  const Icon = status === "paid" ? CheckCircle2 : status === "rejected" ? XCircle : Clock;
  const cls =
    status === "paid"
      ? "bg-success/15 text-success"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive"
        : "bg-warning/15 text-warning";
  return (
    <span className={`h-8 w-8 rounded-full flex items-center justify-center ${cls}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}
