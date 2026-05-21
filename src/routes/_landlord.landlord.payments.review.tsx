import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2, XCircle, Loader2, Clock, ExternalLink,
  AlertCircle, FileCheck, ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { paymentsApi } from "@/api";
import type { Payment } from "@/api";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/_landlord/landlord/payments/review")({
  head: () => ({ meta: [{ title: "Payment review — MyTenant" }] }),
  component: PaymentReviewPage,
});

// ── Reject form schema ────────────────────────────────────────────────────────

const rejectSchema = z.object({
  rejectionReason: z.string().min(5, "Please provide a reason (at least 5 characters)"),
});
type RejectForm = z.infer<typeof rejectSchema>;

// ── Page component ────────────────────────────────────────────────────────────

function PaymentReviewPage() {
  const qc = useQueryClient();
  const [tab,       setTab]      = useState<"pending" | "all">("pending");
  const [rejectId,  setRejectId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pendingQ = useQuery({
    queryKey: ["payments", "pending"],
    queryFn:  () => paymentsApi.list({ status: "pending", limit: 50 }),
  });
  const allQ = useQuery({
    queryKey: ["payments", "all"],
    queryFn:  () => paymentsApi.list({ limit: 50 }),
    enabled:  tab === "all",
  });

  const pendingPayments: Payment[] =
    (pendingQ.data as { data?: Payment[] } | undefined)?.data ?? [];
  const allPayments: Payment[] =
    (allQ.data as { data?: Payment[] } | undefined)?.data ?? [];

  // ── Approve ─────────────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments", "pending", "count"] });
      toast.success("Payment approved — receipt will be generated shortly.");
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to approve payment"),
  });

  // ── Reject ──────────────────────────────────────────────────────────────────
  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejectionReason: "" },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      paymentsApi.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments", "pending", "count"] });
      toast.success("Payment rejected.");
      setRejectId(null);
      rejectForm.reset();
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to reject payment"),
  });

  const displayed = tab === "pending" ? pendingPayments : allPayments;
  const isLoading = tab === "pending" ? pendingQ.isLoading : allQ.isLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Payment review</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and approve incoming payment proofs from your tenants.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "all")}>
        <TabsList className="rounded-xl h-10">
          <TabsTrigger value="pending" className="rounded-lg gap-2">
            Pending
            {pendingPayments.length > 0 && (
              <span className="text-[10px] font-semibold rounded-full bg-accent text-accent-foreground px-1.5 py-0.5">
                {pendingPayments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg">All payments</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayed.length === 0 ? (
            <EmptyState isPending={tab === "pending"} />
          ) : (
            <div className="space-y-3">
              {displayed.map((p) => (
                <PaymentCard
                  key={p.id}
                  payment={p}
                  isApproving={approveMutation.isPending && approveMutation.variables === p.id}
                  onApprove={() => approveMutation.mutate(p.id)}
                  onReject={() => { setRejectId(p.id); rejectForm.reset(); }}
                  onPreview={() => setPreviewUrl(p.proofImageUrl)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog
        open={!!rejectId}
        onOpenChange={(v) => { if (!v) { setRejectId(null); rejectForm.reset(); } }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject payment</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={rejectForm.handleSubmit((v) =>
              rejectId && rejectMutation.mutate({ id: rejectId, reason: v.rejectionReason })
            )}
            className="space-y-4 pt-1"
          >
            <div className="space-y-1.5">
              <Label>Reason for rejection</Label>
              <Textarea
                className="rounded-xl resize-none"
                rows={3}
                placeholder="e.g. Amount doesn't match, wrong account, unclear image…"
                {...rejectForm.register("rejectionReason")}
              />
              {rejectForm.formState.errors.rejectionReason && (
                <p className="text-xs text-destructive">
                  {rejectForm.formState.errors.rejectionReason.message}
                </p>
              )}
            </div>
            {rejectMutation.isError && (
              <p className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {(rejectMutation.error as { message?: string })?.message ?? "Failed to reject"}
              </p>
            )}
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => { setRejectId(null); rejectForm.reset(); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="rounded-xl"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reject payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Proof image preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(v) => !v && setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Payment proof</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center min-h-48">
                <img
                  src={previewUrl}
                  alt="Payment proof"
                  className="max-h-96 w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open full image
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PaymentCard({
  payment: p, isApproving, onApprove, onReject, onPreview,
}: {
  payment: Payment;
  isApproving: boolean;
  onApprove: () => void;
  onReject: () => void;
  onPreview: () => void;
}) {
  const statusConfig = {
    pending:  { label: "Pending",  cls: "bg-warning/15 text-warning border-transparent",  Icon: Clock },
    approved: { label: "Approved", cls: "bg-success/15 text-success border-transparent",  Icon: CheckCircle2 },
    rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive border-transparent", Icon: XCircle },
  }[p.status];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-4">
        {/* Proof thumbnail */}
        <button
          onClick={onPreview}
          className="h-16 w-16 rounded-xl border border-border bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
          title="View proof"
        >
          {p.proofImageUrl ? (
            <img
              src={p.proofImageUrl}
              alt="Proof"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).replaceWith(
                  Object.assign(document.createElement("div"), {
                    innerHTML: `<span class="text-muted-foreground">?</span>`,
                  })
                );
              }}
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={`rounded-full text-[11px] ${statusConfig.cls}`}
            >
              <statusConfig.Icon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(p.submittedAt)}</span>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight">
            {formatCurrency(p.amountClaimed)}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span>Method: <span className="text-foreground capitalize">{p.paymentMethod}</span></span>
            <span>Date: <span className="text-foreground">{formatDate(p.paymentDate)}</span></span>
            {p.referenceNumber && (
              <span>Ref: <span className="text-foreground font-mono">{p.referenceNumber}</span></span>
            )}
          </div>
          {p.notes && (
            <p className="mt-2 text-xs text-muted-foreground italic">"{p.notes}"</p>
          )}
          {p.rejectionReason && (
            <p className="mt-2 text-xs text-destructive bg-destructive/8 rounded-lg px-2 py-1">
              Rejected: {p.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {p.status === "pending" && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={onReject}
          >
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button
            size="sm"
            className="rounded-xl gap-2 bg-success hover:bg-success/90 text-success-foreground ml-auto"
            onClick={onApprove}
            disabled={isApproving}
          >
            {isApproving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <CheckCircle2 className="h-4 w-4" />
            }
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ isPending }: { isPending: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <FileCheck className="h-7 w-7" />
      </div>
      <h3 className="font-semibold">
        {isPending ? "No pending payments" : "No payments yet"}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {isPending
          ? "All caught up! New payment proofs will appear here when tenants submit them."
          : "Payments from your tenants will show up here once they start submitting proofs."}
      </p>
    </div>
  );
}
