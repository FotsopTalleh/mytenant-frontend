import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CloudUpload, CheckCircle2, XCircle, Clock, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { paymentsApi } from "@/api";
import type { Payment } from "@/api";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/_tenant/tenant/payments")({
  head: () => ({ meta: [{ title: "Payment history — MyTenant" }] }),
  component: PaymentsPage,
});

const STATUS_CFG = {
  approved: { label: "Approved", icon: CheckCircle2, cls: "bg-success/15 text-success" },
  rejected: { label: "Rejected",  icon: XCircle,      cls: "bg-destructive/15 text-destructive" },
  pending:  { label: "Under review", icon: Clock,     cls: "bg-warning/15 text-warning" },
} as const;

function PaymentsPage() {
  const [preview, setPreview] = useState<Payment | null>(null);
  const paymentsQ = useQuery({
    queryKey: ["payments", "my", "all"],
    queryFn:  () => paymentsApi.list({ limit: 100 }),
  });
  const payments: Payment[] = (paymentsQ.data as { data?: Payment[] } | undefined)?.data ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment history</h1>
          <p className="text-muted-foreground text-sm mt-1">Every proof you've submitted.</p>
        </div>
        <Button asChild className="rounded-xl gap-2 shrink-0">
          <Link to="/tenant/upload"><CloudUpload className="h-4 w-4" /> New upload</Link>
        </Button>
      </div>

      {paymentsQ.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-2xl border border-dashed border-border">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <CloudUpload className="h-7 w-7" />
          </div>
          <h3 className="font-semibold">No payments yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">Upload your first payment proof and your landlord will review it.</p>
          <Button asChild className="mt-5 rounded-xl gap-2">
            <Link to="/tenant/upload"><CloudUpload className="h-4 w-4" /> Upload proof</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <ul className="divide-y divide-border">
            {payments.map((p) => {
              const cfg  = STATUS_CFG[p.status];
              const Icon = cfg.icon;
              return (
                <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <span className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.cls}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{formatCurrency(p.amountClaimed)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(p.submittedAt)} · {p.paymentMethod.replace("_", " ")}</p>
                    {p.status === "rejected" && p.rejectionReason && (
                      <p className="text-xs text-destructive mt-0.5 truncate">{p.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setPreview(p)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {payments.length} submission{payments.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>Payment proof</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-4">
              <img src={preview.proofImageUrl} alt="Proof" className="w-full rounded-xl object-contain max-h-72 bg-muted" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-semibold">{formatCurrency(preview.amountClaimed)}</p></div>
                <div><p className="text-xs text-muted-foreground">Submitted</p><p className="font-medium">{formatDate(preview.submittedAt)}</p></div>
                <div><p className="text-xs text-muted-foreground">Method</p><p className="font-medium capitalize">{preview.paymentMethod.replace("_", " ")}</p></div>
                {preview.referenceNumber && <div><p className="text-xs text-muted-foreground">Reference</p><p className="font-mono text-xs">{preview.referenceNumber}</p></div>}
              </div>
              {preview.status === "rejected" && preview.rejectionReason && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div><p className="font-medium">Rejection reason</p><p className="text-xs mt-0.5">{preview.rejectionReason}</p></div>
                </div>
              )}
              {preview.landlordNote && (
                <div className="rounded-xl bg-muted/50 px-3 py-2.5 text-sm">
                  <p className="text-xs text-muted-foreground mb-0.5">Landlord note</p>
                  <p>{preview.landlordNote}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
