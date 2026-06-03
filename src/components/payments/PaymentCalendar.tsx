import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import { useState } from "react";
import { paymentsApi } from "@/api";
import type { MonthSummary } from "@/api";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface PaymentCalendarProps {
  /** For landlord: pass the tenantId to view. For tenant: leave undefined. */
  tenantId?: string;
}

// ── Tooltip bubble ────────────────────────────────────────────────────────────
function MonthTooltip({ m }: { m: MonthSummary }) {
  const [month, yearStr] = m.month.split("-");
  const label = `${MONTH_LABELS[parseInt(month, 10) - 1]} ${yearStr}`;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      <div className="bg-popover border border-border rounded-xl shadow-lg px-3 py-2 text-xs whitespace-nowrap min-w-[140px]">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground mt-0.5">
          Paid: <span className="text-foreground font-medium">{formatCurrency(m.totalPaid)}</span>
        </p>
        <p className="text-muted-foreground">
          Rent: <span className="text-foreground font-medium">{formatCurrency(m.monthlyRent)}</span>
        </p>
        <p className={cn(
          "mt-1 font-semibold",
          m.status === "paid"    && "text-emerald-500",
          m.status === "partial" && "text-amber-500",
          m.status === "unpaid"  && "text-muted-foreground",
        )}>
          {m.status === "paid"    && `✓ Fully paid (${m.percentage}%)`}
          {m.status === "partial" && `${m.percentage}% paid`}
          {m.status === "unpaid"  && "Not paid"}
        </p>
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
    </div>
  );
}

// ── Single month cell ─────────────────────────────────────────────────────────
function MonthCell({ m }: { m: MonthSummary }) {
  const [, month] = m.month.split("-");
  const label = MONTH_LABELS[parseInt(month, 10) - 1];

  const ringClass = cn(
    "absolute inset-0 rounded-2xl ring-2 transition-all",
    m.status === "paid"    && "ring-emerald-500/60",
    m.status === "partial" && "ring-amber-400/60",
    m.status === "unpaid"  && "ring-transparent",
  );

  const bgClass = cn(
    "absolute inset-0 rounded-2xl transition-colors",
    m.status === "paid"    && "bg-emerald-500/10",
    m.status === "partial" && "bg-amber-400/8",
    m.status === "unpaid"  && "bg-muted/30",
  );

  const pct = Math.min(m.percentage, 100);

  return (
    <div className="relative group cursor-default select-none">
      {/* Tooltip */}
      <MonthTooltip m={m} />

      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 p-3 flex flex-col gap-2 min-h-[88px]">
        <div className={bgClass} />
        <div className={ringClass} />

        {/* Month label + status icon */}
        <div className="relative flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{label}</span>
          {m.status === "paid" && (
            <span className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          {m.status === "partial" && (
            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 rounded-full px-1.5 py-0.5">
              {pct}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 rounded-full bg-muted/60 overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              m.status === "paid"    && "bg-emerald-500",
              m.status === "partial" && "bg-amber-400",
              m.status === "unpaid"  && "bg-transparent",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Amount */}
        <p className="relative text-[10px] text-muted-foreground leading-none">
          {m.totalPaid > 0 ? formatCurrency(m.totalPaid) : "—"}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PaymentCalendar({ tenantId }: PaymentCalendarProps) {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payments", "calendar", tenantId, year],
    queryFn: () => paymentsApi.getCalendar({ tenantId, year }),
    enabled: tenantId !== undefined ? !!tenantId : true,
  });

  const months = data?.months ?? [];
  const monthlyRent = data?.monthlyRent ?? 0;

  const paidCount    = months.filter((m) => m.status === "paid").length;
  const partialCount = months.filter((m) => m.status === "partial").length;
  const totalPaidYTD = months.reduce((s, m) => s + m.totalPaid, 0);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CalendarDays className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm leading-tight">Payment Calendar</h2>
            {monthlyRent > 0 && (
              <p className="text-xs text-muted-foreground">
                Monthly rent: {formatCurrency(monthlyRent)}
              </p>
            )}
          </div>
        </div>

        {/* Year navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold tabular-nums w-12 text-center">{year}</span>
          <Button
            variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= new Date().getFullYear()}
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary pills */}
      {months.length > 0 && (
        <div className="flex gap-2 flex-wrap text-xs">
          <span className="bg-emerald-500/10 text-emerald-600 rounded-full px-2.5 py-1 font-medium">
            {paidCount} paid
          </span>
          {partialCount > 0 && (
            <span className="bg-amber-400/10 text-amber-600 rounded-full px-2.5 py-1 font-medium">
              {partialCount} partial
            </span>
          )}
          <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 font-medium ml-auto">
            YTD: {formatCurrency(totalPaidYTD)}
          </span>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive text-center py-8">
          Could not load payment calendar.
        </p>
      ) : (tenantId === undefined || tenantId) && months.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No payment data for {year}.
        </p>
      ) : !tenantId && tenantId !== undefined ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Select a tenant to view their calendar.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {months.map((m) => (
            <MonthCell key={m.month} m={m} />
          ))}
        </div>
      )}

      {/* Legend */}
      {months.length > 0 && (
        <div className="flex gap-4 text-[10px] text-muted-foreground pt-1 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Fully paid
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Partial payment
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> Unpaid
          </span>
        </div>
      )}
    </div>
  );
}
