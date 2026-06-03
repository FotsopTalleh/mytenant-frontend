import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2, XCircle, Loader2, Clock, ExternalLink,
  AlertCircle, FileCheck, ImageIcon, Send, Edit3, CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { paymentsApi, receiptsApi, tenantsApi } from "@/api";
import type { Payment, ApproveResponse, DisburseReceiptBody } from "@/api";
import type { Tenant } from "@/api";
import { formatCurrency, formatDate } from "@/utils/format";
import { PaymentCalendar } from "@/components/payments/PaymentCalendar";

export const Route = createFileRoute("/_landlord/landlord/payments/review")({
  head: () => ({ meta: [{ title: "Payment review — MyTenant" }] }),
  component: PaymentReviewPage,
});

// ── Reject form schema ────────────────────────────────────────────────────────
const rejectSchema = z.object({
  rejectionReason: z.string().min(5, "Please provide a reason (at least 5 characters)"),
});
type RejectForm = z.infer<typeof rejectSchema>;

// ── Disburse / edit-receipt form schema ──────────────────────────────────────
const PAYMENT_METHODS = [
  { value: "cash",          label: "Cash" },
  { value: "mobile_money",  label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other",         label: "Other" },
] as const;

const disburseSchema = z.object({
  tenantName:      z.string().min(1, "Name is required"),
  amountPaid:      z.coerce.number().min(0.01, "Amount must be > 0"),
  paymentDate:     z.string().min(1, "Date is required"),
  paymentMethod:   z.string().min(1, "Method is required"),
  referenceNumber: z.string().max(200).optional(),
  notes:           z.string().max(1000).optional(),
  periodLabel:     z.string().max(100).optional(),
});
type DisburseForm = z.infer<typeof disburseSchema>;

// ── Page component ────────────────────────────────────────────────────────────
function PaymentReviewPage() {
  const qc = useQueryClient();

  // Tabs: payments | calendar
  const [pageTab, setPageTab]         = useState<"payments" | "calendar">("payments");

  // Payments sub-tab: pending | all
  const [tab,       setTab]           = useState<"pending" | "all">("pending");

  // Modal states
  const [rejectId,   setRejectId]     = useState<string | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);

  // Edit-receipt (disburse) dialog
  const [draftReceipt, setDraftReceipt] = useState<ApproveResponse | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);

  // Calendar tenant selector
  const [calTenantId, setCalTenantId] = useState<string>("");

  // ── Data queries ────────────────────────────────────────────────────────────
  const pendingQ = useQuery({
    queryKey: ["payments", "pending"],
    queryFn:  () => paymentsApi.list({ status: "pending", limit: 50 }),
  });
  const allQ = useQuery({
    queryKey: ["payments", "all"],
    queryFn:  () => paymentsApi.list({ limit: 50 }),
    enabled:  tab === "all",
  });
  const tenantsQ = useQuery({
    queryKey: ["tenants", "active"],
    queryFn:  () => tenantsApi.list({ status: "active", limit: 100 }),
    enabled:  pageTab === "calendar",
  });

  const pendingPayments: Payment[] = (pendingQ.data as { data?: Payment[] } | undefined)?.data ?? [];
  const allPayments:     Payment[] = (allQ.data    as { data?: Payment[] } | undefined)?.data ?? [];
  const tenants:         Tenant[]  = (tenantsQ.data as { data?: Tenant[] } | undefined)?.data ?? [];

  // ── Approve → open disburse dialog ─────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.approve(id),
    onSuccess: async (result) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payments", "pending", "count"] });

      if (result.receiptId) {
        // Load the draft receipt data into the disburse dialog
        setDraftLoading(true);
        try {
          await receiptsApi.getDraft(result.receiptId); // prime the cache
          setDraftReceipt(result);
          setDraftLoading(false);
        } catch {
          setDraftLoading(false);
          toast.error("Payment approved but could not load receipt draft.");
        }
      } else {
        toast.success("Payment approved.");
      }
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

  // ── Disburse receipt ────────────────────────────────────────────────────────
  const draftQ = useQuery({
    queryKey: ["receipts", "draft", draftReceipt?.receiptId],
    queryFn:  () => receiptsApi.getDraft(draftReceipt!.receiptId!),
    enabled:  !!draftReceipt?.receiptId,
  });

  const disburseForm = useForm<DisburseForm>({
    resolver: zodResolver(disburseSchema),
    values: draftQ.data ? {
      tenantName:      draftQ.data.tenantName ?? "",
      amountPaid:      draftQ.data.amountPaid ?? 0,
      paymentDate:     draftQ.data.paymentDate ?? "",
      paymentMethod:   draftQ.data.paymentMethod ?? "cash",
      referenceNumber: draftQ.data.referenceNumber ?? "",
      notes:           draftQ.data.notes ?? "",
      periodLabel:     draftQ.data.periodLabel ?? "",
    } : undefined,
  });

  const disburseMutation = useMutation({
    mutationFn: (body: DisburseReceiptBody) =>
      receiptsApi.disburse(draftReceipt!.receiptId!, body),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["receipts"] });
      toast.success(`Receipt ${r.receiptNumber} disbursed to tenant.`);
      setDraftReceipt(null);
      disburseForm.reset();
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to disburse receipt"),
  });

  const onDisburseSubmit = (values: DisburseForm) => {
    disburseMutation.mutate({
      tenantName:      values.tenantName      || undefined,
      amountPaid:      values.amountPaid,
      paymentDate:     values.paymentDate      || undefined,
      paymentMethod:   values.paymentMethod    || undefined,
      referenceNumber: values.referenceNumber  || undefined,
      notes:           values.notes            || undefined,
      periodLabel:     values.periodLabel      || undefined,
    });
  };

  const displayed  = tab === "pending" ? pendingPayments : allPayments;
  const isLoading  = tab === "pending" ? pendingQ.isLoading : allQ.isLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Payment review</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review payment proofs, edit receipts, and track rent by month.
        </p>
      </div>

      {/* Top-level tabs: Payments | Calendar */}
      <Tabs value={pageTab} onValueChange={(v) => setPageTab(v as "payments" | "calendar")}>
        <TabsList className="rounded-xl h-10">
          <TabsTrigger value="payments" className="rounded-lg gap-2">
            <FileCheck className="h-4 w-4" /> Payments
            {pendingPayments.length > 0 && (
              <span className="text-[10px] font-semibold rounded-full bg-accent text-accent-foreground px-1.5 py-0.5">
                {pendingPayments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg gap-2">
            <CalendarDays className="h-4 w-4" /> Rent Calendar
          </TabsTrigger>
        </TabsList>

        {/* ── PAYMENTS TAB ── */}
        <TabsContent value="payments" className="mt-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "all")}>
            <TabsList className="rounded-xl h-9 text-xs">
              <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
              <TabsTrigger value="all"     className="rounded-lg">All payments</TabsTrigger>
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
                      isApproving={
                        (approveMutation.isPending || draftLoading) &&
                        approveMutation.variables === p.id
                      }
                      onApprove={() => approveMutation.mutate(p.id)}
                      onReject={() => { setRejectId(p.id); rejectForm.reset(); }}
                      onPreview={() => setPreviewUrl(p.proofImageUrl)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── CALENDAR TAB ── */}
        <TabsContent value="calendar" className="mt-4 space-y-4">
          {/* Tenant selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-muted-foreground shrink-0">View tenant:</label>
            <select
              className="rounded-xl border border-border bg-card text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={calTenantId}
              onChange={(e) => setCalTenantId(e.target.value)}
            >
              <option value="">— select a tenant —</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName ?? t.email ?? t.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          {calTenantId ? (
            <PaymentCalendar tenantId={calTenantId} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a tenant above to view their 12-month rent payment calendar.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Reject dialog ── */}
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
              <Button type="button" variant="outline" className="rounded-xl"
                onClick={() => { setRejectId(null); rejectForm.reset(); }}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" className="rounded-xl"
                disabled={rejectMutation.isPending}>
                {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reject payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Proof image preview dialog ── */}
      <Dialog open={!!previewUrl} onOpenChange={(v) => !v && setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>Payment proof</DialogTitle></DialogHeader>
          {previewUrl && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center min-h-48">
                <img
                  src={previewUrl} alt="Payment proof"
                  className="max-h-96 w-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <a href={previewUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Open full image
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit & Disburse Receipt Dialog ── */}
      <Dialog
        open={!!draftReceipt}
        onOpenChange={(v) => {
          if (!v) { setDraftReceipt(null); disburseForm.reset(); disburseMutation.reset(); }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Edit & Disburse Receipt</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Review and edit the receipt details below, then disburse it to the tenant.
                  {draftReceipt?.receiptNumber && (
                    <span className="ml-1 font-mono font-medium text-foreground">
                      ({draftReceipt.receiptNumber})
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {draftQ.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={disburseForm.handleSubmit(onDisburseSubmit)} className="space-y-4 pt-2">

              {/* Tenant Name */}
              <div className="space-y-1.5">
                <Label htmlFor="d-tenant">Tenant Name <span className="text-destructive">*</span></Label>
                <Input id="d-tenant" className="rounded-xl" placeholder="Full name"
                  {...disburseForm.register("tenantName")} />
                {disburseForm.formState.errors.tenantName && (
                  <p className="text-xs text-destructive">{disburseForm.formState.errors.tenantName.message}</p>
                )}
              </div>

              {/* Amount + Period row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="d-amount">Amount Paid <span className="text-destructive">*</span></Label>
                  <Input id="d-amount" type="number" step="0.01" min="0.01"
                    className="rounded-xl" placeholder="0.00"
                    {...disburseForm.register("amountPaid")} />
                  {disburseForm.formState.errors.amountPaid && (
                    <p className="text-xs text-destructive">{disburseForm.formState.errors.amountPaid.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="d-period">
                    Period <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input id="d-period" className="rounded-xl" placeholder="e.g. January 2025"
                    {...disburseForm.register("periodLabel")} />
                </div>
              </div>

              {/* Payment date + method row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="d-date">Payment Date <span className="text-destructive">*</span></Label>
                  <Input id="d-date" type="date" className="rounded-xl"
                    {...disburseForm.register("paymentDate")} />
                  {disburseForm.formState.errors.paymentDate && (
                    <p className="text-xs text-destructive">{disburseForm.formState.errors.paymentDate.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Method <span className="text-destructive">*</span></Label>
                  <Controller
                    name="paymentMethod"
                    control={disburseForm.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {disburseForm.formState.errors.paymentMethod && (
                    <p className="text-xs text-destructive">{disburseForm.formState.errors.paymentMethod.message}</p>
                  )}
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <Label htmlFor="d-ref">Reference <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="d-ref" className="rounded-xl" placeholder="Transaction ID / cheque no."
                  {...disburseForm.register("referenceNumber")} />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="d-notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea id="d-notes" rows={2} className="rounded-xl resize-none"
                  placeholder="Any additional details…"
                  {...disburseForm.register("notes")} />
              </div>

              {disburseMutation.isError && (
                <p className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {(disburseMutation.error as { message?: string })?.message ?? "Failed to disburse receipt"}
                </p>
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" className="rounded-xl"
                  onClick={() => { setDraftReceipt(null); disburseForm.reset(); disburseMutation.reset(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl gap-2" disabled={disburseMutation.isPending}>
                  {disburseMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                  Disburse Receipt
                </Button>
              </DialogFooter>
            </form>
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
              src={p.proofImageUrl} alt="Proof"
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`rounded-full text-[11px] ${statusConfig.cls}`}>
              <statusConfig.Icon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(p.submittedAt)}</span>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight">{formatCurrency(p.amountClaimed)}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span>Method: <span className="text-foreground capitalize">{p.paymentMethod}</span></span>
            <span>Date: <span className="text-foreground">{formatDate(p.paymentDate)}</span></span>
            {p.referenceNumber && (
              <span>Ref: <span className="text-foreground font-mono">{p.referenceNumber}</span></span>
            )}
          </div>
          {p.notes && <p className="mt-2 text-xs text-muted-foreground italic">"{p.notes}"</p>}
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
            variant="outline" size="sm"
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
            Approve & Edit Receipt
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
