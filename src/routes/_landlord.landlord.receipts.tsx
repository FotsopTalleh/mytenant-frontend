import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Receipt,
  Download,
  ExternalLink,
  Loader2,
  Search,
  Plus,
  AlertCircle,
  HandCoins,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { receiptsApi, tenantsApi } from "@/api";
import type { Receipt as ReceiptType, ManualReceiptBody } from "@/api";
import type { Tenant } from "@/api";
import { formatCurrency, formatDate } from "@/utils/format";

export const Route = createFileRoute("/_landlord/landlord/receipts")({
  head: () => ({ meta: [{ title: "Receipts — MyTenant" }] }),
  component: ReceiptsPage,
});

// ── Manual receipt form schema ────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "cash",          label: "Cash" },
  { value: "mobile_money",  label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other",         label: "Other" },
] as const;

const manualSchema = z.object({
  tenantId:        z.string().min(1, "Please select a tenant"),
  amountPaid:      z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentDate:     z.string().min(1, "Payment date is required"),
  paymentMethod:   z.enum(["cash", "mobile_money", "bank_transfer", "other"], {
    required_error: "Please select a payment method",
  }),
  referenceNumber: z.string().max(200).optional(),
  notes:           z.string().max(1000).optional(),
});
type ManualForm = z.infer<typeof manualSchema>;

// Track which receipt is being acted on and what action
type ActiveAction = { id: string; action: "view" | "download" } | null;

// ── Page ─────────────────────────────────────────────────────────────────────

function ReceiptsPage() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState("");
  const [active, setActive]       = useState<ActiveAction>(null);
  const [showManual, setShowManual] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const receiptsQ = useQuery({
    queryKey: ["receipts"],
    queryFn:  () => receiptsApi.list({ limit: 100 }),
  });

  const tenantsQ = useQuery({
    queryKey: ["tenants", "active"],
    queryFn:  () => tenantsApi.list({ status: "active", limit: 100 }),
    enabled:  showManual,
  });

  const receipts: ReceiptType[] =
    (receiptsQ.data as { data?: ReceiptType[] } | undefined)?.data ?? [];
  const tenants: Tenant[] =
    (tenantsQ.data as { data?: Tenant[] } | undefined)?.data ?? [];

  const filtered = receipts.filter((r) =>
    r.receiptNumber.toLowerCase().includes(search.toLowerCase())
  );

  // ── View (open in new tab) ────────────────────────────────────────────────
  const handleView = async (r: ReceiptType) => {
    setActive({ id: r.id, action: "view" });
    try {
      await receiptsApi.openReceipt(r.id);
    } catch {
      toast.error("Could not open receipt. Please try again.");
    } finally {
      setActive(null);
    }
  };

  // ── Download (save to disk) ───────────────────────────────────────────────
  const handleDownload = async (r: ReceiptType) => {
    setActive({ id: r.id, action: "download" });
    try {
      await receiptsApi.downloadReceipt(r.id);
    } catch {
      toast.error("Could not download receipt. Please try again.");
    } finally {
      setActive(null);
    }
  };

  // ── Manual receipt mutation ───────────────────────────────────────────────
  const manualForm = useForm<ManualForm>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      tenantId:        "",
      amountPaid:      undefined,
      paymentDate:     new Date().toISOString().split("T")[0],
      paymentMethod:   undefined,
      referenceNumber: "",
      notes:           "",
    },
  });

  const manualMutation = useMutation({
    mutationFn: (body: ManualReceiptBody) => receiptsApi.createManual(body),
    onSuccess: (newReceipt) => {
      qc.invalidateQueries({ queryKey: ["receipts"] });
      toast.success(
        `Receipt ${newReceipt.receiptNumber} created and sent to tenant.`
      );
      setShowManual(false);
      manualForm.reset();
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to create manual receipt."),
  });

  const onManualSubmit = (values: ManualForm) => {
    manualMutation.mutate({
      tenantId:        values.tenantId,
      amountPaid:      values.amountPaid,
      paymentDate:     values.paymentDate,
      paymentMethod:   values.paymentMethod,
      referenceNumber: values.referenceNumber || undefined,
      notes:           values.notes || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Download and share digital rent receipts.
          </p>
        </div>

        {/* Create manual receipt button */}
        <Button
          className="rounded-xl gap-2 shrink-0"
          onClick={() => setShowManual(true)}
        >
          <Plus className="h-4 w-4" />
          Create Manual Receipt
        </Button>
      </div>

      {/* ── Search ── */}
      {receipts.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="rounded-xl h-10 pl-9"
            placeholder="Search receipt number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* ── Content ── */}
      {receiptsQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasReceipts={receipts.length > 0} onCreateManual={() => setShowManual(true)} />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Receipt #</span>
            <span className="text-right">Amount</span>
            <span className="text-right hidden sm:block">Date</span>
            <span className="hidden sm:block">Type</span>
            <span />
          </div>

          {/* Rows */}
          <ul className="divide-y divide-border">
            {filtered.map((r) => (
              <ReceiptRow
                key={r.id}
                receipt={r}
                active={active}
                onView={() => handleView(r)}
                onDownload={() => handleDownload(r)}
              />
            ))}
          </ul>

          <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {filtered.length} receipt{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </div>
        </div>
      )}

      {/* ── Manual Receipt Dialog ── */}
      <Dialog
        open={showManual}
        onOpenChange={(open) => {
          if (!open) {
            setShowManual(false);
            manualForm.reset();
            manualMutation.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <HandCoins className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Create Manual Receipt</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  Record a cash or in-person payment and issue a receipt directly.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4 pt-2">
            {/* Tenant selector */}
            <div className="space-y-1.5">
              <Label htmlFor="manual-tenantId">Tenant <span className="text-destructive">*</span></Label>
              <Controller
                name="tenantId"
                control={manualForm.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="manual-tenantId" className="rounded-xl">
                      <SelectValue placeholder={tenantsQ.isLoading ? "Loading tenants…" : "Select a tenant"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.length === 0 && !tenantsQ.isLoading && (
                        <SelectItem value="__none__" disabled>
                          No active tenants found
                        </SelectItem>
                      )}
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.fullName
                            ? `${t.fullName}${t.email ? ` (${t.email})` : ""}`
                            : t.email ?? t.id.slice(0, 8) + "…"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {manualForm.formState.errors.tenantId && (
                <p className="text-xs text-destructive">
                  {manualForm.formState.errors.tenantId.message}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="manual-amount">Amount Paid <span className="text-destructive">*</span></Label>
              <Input
                id="manual-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="rounded-xl"
                {...manualForm.register("amountPaid")}
              />
              {manualForm.formState.errors.amountPaid && (
                <p className="text-xs text-destructive">
                  {manualForm.formState.errors.amountPaid.message}
                </p>
              )}
            </div>

            {/* Payment date + method (2 col) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="manual-date">Payment Date <span className="text-destructive">*</span></Label>
                <Input
                  id="manual-date"
                  type="date"
                  className="rounded-xl"
                  {...manualForm.register("paymentDate")}
                />
                {manualForm.formState.errors.paymentDate && (
                  <p className="text-xs text-destructive">
                    {manualForm.formState.errors.paymentDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manual-method">Payment Method <span className="text-destructive">*</span></Label>
                <Controller
                  name="paymentMethod"
                  control={manualForm.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="manual-method" className="rounded-xl">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {manualForm.formState.errors.paymentMethod && (
                  <p className="text-xs text-destructive">
                    {manualForm.formState.errors.paymentMethod.message}
                  </p>
                )}
              </div>
            </div>

            {/* Reference number (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="manual-ref">Reference Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="manual-ref"
                placeholder="e.g. cheque no., transaction ID…"
                className="rounded-xl"
                {...manualForm.register("referenceNumber")}
              />
            </div>

            {/* Notes (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="manual-notes">Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="manual-notes"
                placeholder="Any additional details about this payment…"
                className="rounded-xl resize-none"
                rows={2}
                {...manualForm.register("notes")}
              />
            </div>

            {/* API error */}
            {manualMutation.isError && (
              <p className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {(manualMutation.error as { message?: string })?.message ??
                  "Failed to create receipt. Please try again."}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setShowManual(false);
                  manualForm.reset();
                  manualMutation.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl gap-2"
                disabled={manualMutation.isPending}
              >
                {manualMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create Receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ReceiptRow({
  receipt: r,
  active,
  onView,
  onDownload,
}: {
  receipt: ReceiptType;
  active: ActiveAction;
  onView: () => void;
  onDownload: () => void;
}) {
  const isViewing     = active?.id === r.id && active.action === "view";
  const isDownloading = active?.id === r.id && active.action === "download";
  const isBusy        = active?.id === r.id;

  return (
    <li className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Receipt className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{r.receiptNumber}</p>
          <p className="text-xs text-muted-foreground sm:hidden">
            {formatDate(r.createdAt)}
          </p>
        </div>
      </div>

      <div className="text-sm font-semibold text-right">
        {formatCurrency(r.amountPaid)}
      </div>

      <div className="text-sm text-muted-foreground text-right hidden sm:block">
        {formatDate(r.createdAt)}
      </div>

      {/* Manual badge */}
      <div className="hidden sm:block">
        {r.isManual ? (
          <Badge
            variant="outline"
            className="rounded-full text-[11px] bg-amber-500/10 text-amber-600 border-transparent"
          >
            Manual
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="rounded-full text-[11px] bg-success/10 text-success border-transparent"
          >
            Auto
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* View in new tab */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={onView}
          disabled={isBusy}
          title="View receipt in new tab"
        >
          {isViewing
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ExternalLink className="h-4 w-4" />
          }
        </Button>

        {/* Download */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={onDownload}
          disabled={isBusy}
          title="Download receipt PDF"
        >
          {isDownloading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />
          }
        </Button>
      </div>
    </li>
  );
}

function EmptyState({
  hasReceipts,
  onCreateManual,
}: {
  hasReceipts: boolean;
  onCreateManual: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Receipt className="h-7 w-7" />
      </div>
      <h3 className="font-semibold">
        {hasReceipts ? "No results" : "No receipts yet"}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {hasReceipts
          ? "Try a different search term."
          : "Receipts are generated when you approve a payment proof, or you can create one manually for hand payments."}
      </p>
      {!hasReceipts && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 rounded-xl gap-2"
          onClick={onCreateManual}
        >
          <Plus className="h-4 w-4" />
          Create Manual Receipt
        </Button>
      )}
    </div>
  );
}

// Re-export ActiveAction for ReceiptRow — needs to be in scope
type ActiveAction = { id: string; action: "view" | "download" } | null;
