import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  CloudUpload, X, Loader2, AlertCircle, CheckCircle2, ImageIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { paymentsApi } from "@/api";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/_tenant/tenant/upload")({
  head: () => ({ meta: [{ title: "Upload payment — MyTenant" }] }),
  component: UploadPage,
});

// ── Schema ────────────────────────────────────────────────────────────────────

const uploadSchema = z.object({
  amountClaimed:   z.coerce.number().positive("Enter the amount you paid"),
  paymentDate:     z.string().min(1, "Select the payment date"),
  paymentMethod:   z.string().min(1, "Select a payment method"),
  referenceNumber: z.string().optional(),
  notes:           z.string().optional(),
});
type UploadForm = z.infer<typeof uploadSchema>;

const PAYMENT_METHODS = [
  { value: "bank_transfer",  label: "Bank transfer" },
  { value: "mobile_money",   label: "Mobile money" },
  { value: "cash",           label: "Cash" },
  { value: "cheque",         label: "Cheque" },
  { value: "other",          label: "Other" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

function UploadPage() {
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [file,     setFile]    = useState<File | null>(null);
  const [preview,  setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      paymentDate:   new Date().toISOString().split("T")[0],
      paymentMethod: "",
    },
  });

  // ── File handling ──────────────────────────────────────────────────────────

  const pickFile = (f: File) => {
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      toast.error("Please upload an image or PDF file.");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = useMutation({
    mutationFn: (v: UploadForm) => {
      if (!file) throw new Error("Please attach a proof image or PDF.");
      return paymentsApi.submit({
        amountClaimed:   v.amountClaimed,
        paymentDate:     v.paymentDate,
        paymentMethod:   v.paymentMethod,
        referenceNumber: v.referenceNumber,
        notes:           v.notes,
        proofFile:       file,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment proof submitted! Your landlord will review it shortly.");
      navigate({ to: "/tenant/payments" });
    },
    onError: (e: unknown) => {
      const msg = (e as { message?: string })?.message;
      form.setError("root", { message: msg ?? "Submission failed. Please try again." });
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = form;
  const amount = watch("amountClaimed");

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload payment proof</h1>
        <p className="text-muted-foreground text-sm mt-1">Drag &amp; drop or browse for your receipt.</p>
      </div>

      <form onSubmit={handleSubmit((v) => submit.mutate(v))} className="space-y-5" noValidate>

        {/* ── Drop zone ── */}
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 p-8 cursor-pointer
            ${dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) pickFile(f);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
          />

          {file ? (
            <div className="w-full" onClick={(e) => e.stopPropagation()}>
              {preview ? (
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-full max-h-48 object-contain rounded-xl mb-3"
                />
              ) : (
                <div className="flex items-center justify-center h-24 rounded-xl bg-muted/60 mb-3">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                </div>
              )}
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-medium truncate max-w-[80%]">{file.name}</p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-lg shrink-0"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CloudUpload className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Click or drag a file here</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or PDF — max 10 MB</p>
              </div>
            </>
          )}
        </div>

        {/* ── Amount ── */}
        <div className="space-y-1.5">
          <Label htmlFor="amountClaimed">Amount paid</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              id="amountClaimed"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`rounded-xl h-11 pl-7 ${errors.amountClaimed ? "border-destructive" : ""}`}
              {...register("amountClaimed")}
            />
          </div>
          {amount > 0 && !errors.amountClaimed && (
            <p className="text-xs text-muted-foreground">{formatCurrency(amount)}</p>
          )}
          {errors.amountClaimed && <p className="text-xs text-destructive">{errors.amountClaimed.message}</p>}
        </div>

        {/* ── Payment date ── */}
        <div className="space-y-1.5">
          <Label htmlFor="paymentDate">Payment date</Label>
          <Input
            id="paymentDate"
            type="date"
            className={`rounded-xl h-11 ${errors.paymentDate ? "border-destructive" : ""}`}
            {...register("paymentDate")}
          />
          {errors.paymentDate && <p className="text-xs text-destructive">{errors.paymentDate.message}</p>}
        </div>

        {/* ── Payment method ── */}
        <div className="space-y-1.5">
          <Label htmlFor="paymentMethod">Payment method</Label>
          <select
            id="paymentMethod"
            className={`w-full h-11 px-3 rounded-xl border text-sm bg-background
              ${errors.paymentMethod ? "border-destructive" : "border-border"}
              focus:outline-none focus:ring-2 focus:ring-ring`}
            {...register("paymentMethod")}
          >
            <option value="">Select method…</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod.message}</p>}
        </div>

        {/* ── Reference ── */}
        <div className="space-y-1.5">
          <Label htmlFor="referenceNumber">
            Reference / transaction ID <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="referenceNumber"
            placeholder="e.g. TXN123456"
            className="rounded-xl h-11"
            {...register("referenceNumber")}
          />
        </div>

        {/* ── Notes ── */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">
            Notes <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="Any extra info for your landlord…"
            className="rounded-xl resize-none"
            rows={3}
            {...register("notes")}
          />
        </div>

        {/* ── Server error ── */}
        {errors.root && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{errors.root.message}</span>
          </div>
        )}

        {/* ── Submit ── */}
        <Button
          type="submit"
          disabled={submit.isPending || !file}
          className="w-full h-11 rounded-xl gap-2"
        >
          {submit.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <CheckCircle2 className="h-4 w-4" />
          }
          {submit.isPending ? "Submitting…" : "Submit proof"}
        </Button>
      </form>
    </div>
  );
}
