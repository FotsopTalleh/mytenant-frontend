import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Building2, MapPin, Users, Loader2, Trash2,
  MoreHorizontal, AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { propertiesApi } from "@/api";
import type { Property } from "@/api";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_landlord/landlord/properties")({
  head: () => ({ meta: [{ title: "Properties — MyTenant" }] }),
  component: PropertiesPage,
});

// ── Property types — must match backend constants.py PROPERTY_TYPES exactly ──

const PROPERTY_TYPES = [
  { value: "apartment",  label: "Apartment / Flat"          },
  { value: "house",      label: "House / Villa"             },
  { value: "commercial", label: "Commercial (Shop / Office)" },
  { value: "other",      label: "Other"                     },
] as const;

// ── Form schema ───────────────────────────────────────────────────────────────

const propertySchema = z.object({
  name:         z.string().min(1, "Property name is required"),
  address:      z.string().min(3, "Please enter a valid address"),
  propertyType: z.enum(["apartment", "house", "commercial", "other"], {
    errorMap: () => ({ message: "Select a property type" }),
  }),
  monthlyRent:  z.coerce.number().min(1000, "Minimum rent is 1 000 FCFA"),
  description:  z.string().optional(),
});
type PropertyForm = z.infer<typeof propertySchema>;

// ── Page component ────────────────────────────────────────────────────────────

function PropertiesPage() {
  const qc = useQueryClient();
  const [addOpen,  setAddOpen]  = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const propertiesQ = useQuery({
    queryKey: ["properties"],
    queryFn:  () => propertiesApi.list({ limit: 50 }),
  });

  const properties: Property[] =
    (propertiesQ.data as { data?: Property[] } | undefined)?.data ?? [];

  // ── Create ──────────────────────────────────────────────────────────────────

  const {
    register, handleSubmit, control, reset,
    formState: { errors },
  } = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: "", address: "", propertyType: undefined, monthlyRent: 0, description: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: PropertyForm) =>
      propertiesApi.create({
        name:         values.name,
        address:      values.address,
        propertyType: values.propertyType,
        monthlyRent:  values.monthlyRent,
        description:  values.description,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property added successfully");
      setAddOpen(false);
      reset();
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to add property"),
  });

  // ── Delete ──────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property removed");
      setDeleteId(null);
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to remove property"),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your rental properties.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> Add property
        </Button>
      </div>

      {/* List */}
      {propertiesQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : properties.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} onDelete={() => setDeleteId(p.id)} />
          ))}
        </div>
      )}

      {/* ── Add dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add property</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4 pt-1">

            {/* Name */}
            <Field label="Property name" error={errors.name?.message}>
              <Input
                className={cn("rounded-xl h-11", errors.name && "border-destructive focus-visible:ring-destructive")}
                placeholder="Sunshine Apartments Block A"
                {...register("name")}
              />
            </Field>

            {/* Address */}
            <Field label="Address" error={errors.address?.message}>
              <Input
                className={cn("rounded-xl h-11", errors.address && "border-destructive focus-visible:ring-destructive")}
                placeholder="123 Rue de la Paix, Yaoundé"
                {...register("address")}
              />
            </Field>

            {/* Property type — Controller required for react-hook-form + Radix Select */}
            <Field label="Property type" error={errors.propertyType?.message}>
              <Controller
                name="propertyType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger
                      className={cn(
                        "rounded-xl h-11",
                        errors.propertyType && "border-destructive focus-visible:ring-destructive ring-1 ring-destructive",
                      )}
                    >
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {/* Monthly rent */}
            <Field label="Monthly rent (FCFA)" error={errors.monthlyRent?.message}>
              <Input
                type="number"
                className={cn("rounded-xl h-11", errors.monthlyRent && "border-destructive focus-visible:ring-destructive")}
                placeholder="75000"
                {...register("monthlyRent")}
              />
            </Field>

            {/* Description */}
            <Field label="Description (optional)" error={errors.description?.message}>
              <Input
                className="rounded-xl h-11"
                placeholder="3-bedroom self-contained unit"
                {...register("description")}
              />
            </Field>

            {/* API error */}
            {createMutation.isError && (
              <p className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {(createMutation.error as { message?: string })?.message ?? "Failed to add property"}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setAddOpen(false); reset(); }}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add property
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the property. Any tenants must be removed first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PropertyCard({ property: p, onDelete }: { property: Property; onDelete: () => void }) {
  const typeLabel =
    PROPERTY_TYPES.find((t) => t.value === p.propertyType)?.label ?? p.propertyType;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg -mr-1">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive gap-2 cursor-pointer"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" /> Remove property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1">
        <p className="font-semibold leading-tight">{p.name}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{p.address}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="rounded-lg text-xs">{typeLabel}</Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <Users className="h-3 w-3" />
          {p.tenantCount ?? 0} tenant{p.tenantCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
        <p className="text-xs text-muted-foreground">Monthly rent</p>
        <p className="font-semibold mt-0.5">{formatCurrency(p.monthlyRent)}</p>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Building2 className="h-7 w-7" />
      </div>
      <h3 className="font-semibold">No properties yet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Add your first property to start inviting tenants and collecting rent.
      </p>
      <Button onClick={onAdd} className="mt-5 rounded-xl gap-2">
        <Plus className="h-4 w-4" /> Add your first property
      </Button>
    </div>
  );
}

/** Shared field wrapper: labels turn red and an error message appears when invalid. */
function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className={cn(error && "text-destructive")}>{label}</Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
