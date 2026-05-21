import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserPlus, Users, Loader2, Trash2, MoreHorizontal, AlertCircle,
  Copy, Check, ChevronRight, Home, AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { tenantsApi, propertiesApi } from "@/api";
import type { Tenant, Property } from "@/api";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_landlord/landlord/tenants")({
  head: () => ({ meta: [{ title: "Tenants — MyTenant" }] }),
  component: TenantsPage,
});

// ── Invite form schema ────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email:       z.string().email("Enter a valid email address"),
  propertyId:  z.string().min(1, "Select a property"),
  monthlyRent: z.coerce.number().min(1000, "Minimum 1 000 FCFA"),
  rentDueDay:  z.coerce
    .number()
    .min(1, "Minimum day is 1")
    .max(28, "Maximum day is 28"),
});
type InviteForm = z.infer<typeof inviteSchema>;

// ── Page component ────────────────────────────────────────────────────────────

function TenantsPage() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeId,   setRemoveId]   = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);

  const tenantsQ = useQuery({
    queryKey: ["tenants"],
    queryFn:  () => tenantsApi.list({ limit: 50 }),
  });

  const propertiesQ = useQuery({
    queryKey: ["properties"],
    queryFn:  () => propertiesApi.list({ limit: 50 }),
  });

  const tenants: Tenant[]      = (tenantsQ.data as { data?: Tenant[] } | undefined)?.data ?? [];
  const properties: Property[] = (propertiesQ.data as { data?: Property[] } | undefined)?.data ?? [];

  // ── Invite ──────────────────────────────────────────────────────────────────

  const {
    register, handleSubmit, control, reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", propertyId: "", monthlyRent: 0, rentDueDay: 1 },
  });

  const inviteMutation = useMutation({
    mutationFn: (v: InviteForm) =>
      tenantsApi.invite({
        email:       v.email,
        propertyId:  v.propertyId,
        monthlyRent: v.monthlyRent,
        rentDueDay:  v.rentDueDay,
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Invitation sent!");
      reset();
      if (result.inviteUrl) {
        setInviteLink(result.inviteUrl);
      } else {
        closeInvite();
      }
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to send invite"),
  });

  // ── Remove ──────────────────────────────────────────────────────────────────

  const removeMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant removed");
      setRemoveId(null);
    },
    onError: (e: { message?: string }) =>
      toast.error(e?.message ?? "Failed to remove tenant"),
  });

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteLink(null);
    reset();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground text-sm mt-1">Invite and manage your tenants.</p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="rounded-xl gap-2"
          disabled={properties.length === 0}
        >
          <UserPlus className="h-4 w-4" /> Invite tenant
        </Button>
      </div>

      {/* No-property warning */}
      {properties.length === 0 && !propertiesQ.isLoading && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex items-center gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          Add a property first before inviting tenants.
        </div>
      )}

      {/* List */}
      {tenantsQ.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tenants.length === 0 ? (
        <EmptyState onInvite={() => setInviteOpen(true)} hasProperties={properties.length > 0} />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-medium">
              {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <ul className="divide-y divide-border">
            {tenants.map((t) => {
              const prop = properties.find((p) => p.id === t.propertyId);
              return (
                <TenantRow
                  key={t.id}
                  tenant={t}
                  propertyName={prop?.name}
                  onRemove={() => setRemoveId(t.id)}
                />
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Invite dialog ──────────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={(v) => !v && closeInvite()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {inviteLink ? "Share invite link" : "Invite a tenant"}
            </DialogTitle>
          </DialogHeader>

          {inviteLink ? (
            /* Invite link display */
            <div className="space-y-4 pt-1">
              <p className="text-sm text-muted-foreground">
                The email was sent. You can also share this link directly with
                the tenant.
              </p>

              {/* Link box — break-all prevents overflow on long JWT tokens */}
              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-3">
                <p className="text-xs font-mono text-foreground/70 break-all leading-relaxed select-all">
                  {inviteLink}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "w-full h-9 rounded-lg gap-2 text-xs font-medium transition-colors",
                    copied && "border-success/40 text-success bg-success/5",
                  )}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5" /> Copied to clipboard!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy invite link</>
                  )}
                </Button>
              </div>

              <DialogFooter>
                <Button className="rounded-xl w-full" onClick={closeInvite}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Invite form */
            <form
              onSubmit={handleSubmit((v) => inviteMutation.mutate(v))}
              className="space-y-4 pt-1"
            >
              {/* Email */}
              <Field label="Tenant email" error={errors.email?.message}>
                <Input
                  type="email"
                  className={cn("rounded-xl h-11", errors.email && "border-destructive focus-visible:ring-destructive")}
                  placeholder="tenant@example.com"
                  {...register("email")}
                />
              </Field>

              {/* Property — Controller for Radix Select */}
              <Field label="Property" error={errors.propertyId?.message}>
                <Controller
                  name="propertyId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        className={cn(
                          "rounded-xl h-11",
                          errors.propertyId && "border-destructive focus-visible:ring-destructive ring-1 ring-destructive",
                        )}
                      >
                        <SelectValue placeholder="Select property…" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              {/* Rent + due day */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Monthly rent (FCFA)" error={errors.monthlyRent?.message}>
                  <Input
                    type="number"
                    className={cn("rounded-xl h-11", errors.monthlyRent && "border-destructive focus-visible:ring-destructive")}
                    placeholder="75000"
                    {...register("monthlyRent")}
                  />
                </Field>
                <Field label="Due day (1–28)" error={errors.rentDueDay?.message}>
                  <Input
                    type="number"
                    min="1"
                    max="28"
                    className={cn("rounded-xl h-11", errors.rentDueDay && "border-destructive focus-visible:ring-destructive")}
                    placeholder="1"
                    {...register("rentDueDay")}
                  />
                </Field>
              </div>

              {/* API error */}
              {inviteMutation.isError && (
                <p className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {(inviteMutation.error as { message?: string })?.message ?? "Failed to send invite"}
                </p>
              )}

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={closeInvite}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send invite
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Remove confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={!!removeId} onOpenChange={(v) => !v && setRemoveId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              This tenant will lose access to the portal. Their payment history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeId && removeMutation.mutate(removeId)}
            >
              {removeMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : "Remove"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TenantRow({
  tenant: t, propertyName, onRemove,
}: {
  tenant: Tenant;
  propertyName?: string;
  onRemove: () => void;
}) {
  // Use enriched fields from backend; fall back to truncated userId
  const displayName = t.fullName || t.email || `${t.userId.slice(0, 8)}…`;
  const initials = t.fullName
    ? t.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "T";

  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {displayName}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          {propertyName && (
            <>
              <Home className="h-3 w-3 shrink-0" />
              <span className="truncate">{propertyName}</span>
              <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
            </>
          )}
          <span className="shrink-0">{formatCurrency(t.monthlyRent)} / month</span>
        </div>
      </div>
      <Badge
        variant={t.status === "active" ? "default" : "secondary"}
        className={cn(
          "rounded-full text-xs shrink-0",
          t.status === "active" && "bg-success/15 text-success border-transparent",
        )}
      >
        {t.status}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive gap-2 cursor-pointer"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" /> Remove tenant
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function EmptyState({
  onInvite, hasProperties,
}: {
  onInvite: () => void;
  hasProperties: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Users className="h-7 w-7" />
      </div>
      <h3 className="font-semibold">No tenants yet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {hasProperties
          ? "Invite your first tenant by sending them a sign-up link."
          : "Add a property first, then invite tenants."}
      </p>
      {hasProperties && (
        <Button onClick={onInvite} className="mt-5 rounded-xl gap-2">
          <UserPlus className="h-4 w-4" /> Invite tenant
        </Button>
      )}
    </div>
  );
}

/** Shared field wrapper: label turns red and error appears below when invalid. */
function Field({
  label, error, children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
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
