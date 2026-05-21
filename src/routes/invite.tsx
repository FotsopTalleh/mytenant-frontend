import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2, AlertCircle, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth.api";
import { inviteSchema, type InviteInput } from "@/lib/schemas/auth.schemas";
import { useAuthStore } from "@/store/authStore";
import { AuthShell } from "@/components/layout/AuthShell";
import { formatCurrency } from "@/utils/format";

const search = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/invite")({
  validateSearch: search,
  head: () => ({
    meta: [{ title: "Accept your invite — MyTenant" }],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useSearch();
  const setAuth = useAuthStore((s) => s.setAuth);

  const verify = useQuery({
    queryKey: ["invite", token],
    queryFn: () => authApi.verifyInviteToken(token ?? ""),
    enabled: !!token,
    retry: false,
  });

  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  const submit = useMutation({
    mutationFn: (v: InviteInput) =>
      authApi.registerTenantViaInvite(token ?? "", { fullName: v.fullName, password: v.password }),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      // Hard redirect — Zustand persist writes to localStorage synchronously before
      // this line. The full page load lets it rehydrate before the guarded
      // /_tenant layout mounts, avoiding the SSR navigation race condition.
      window.location.href = "/tenant/dashboard";
    },
    onError: (e: unknown) => {
      const msg = (e as { message?: string })?.message;
      form.setError("root", {
        message: msg ?? "Something went wrong. Please try again.",
      });
    },
  });

  if (!token) {
    return (
      <AuthShell title="Invite link is missing" subtitle="Ask your landlord to resend the invite.">
        <Button asChild className="w-full rounded-xl"><Link to="/login">Back to sign in</Link></Button>
      </AuthShell>
    );
  }

  if (verify.isLoading) {
    return (
      <AuthShell title="Checking your invite…">
        <div className="flex justify-center py-8 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AuthShell>
    );
  }

  if (verify.isError) {
    return (
      <AuthShell title="Invite is invalid or expired">
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{(verify.error as { message?: string })?.message ?? "Could not verify this link."}</span>
        </div>
        <Button asChild variant="outline" className="w-full mt-4 rounded-xl"><Link to="/login">Back to sign in</Link></Button>
      </AuthShell>
    );
  }

  const data = verify.data!;
  return (
    <AuthShell
      title="You've been invited"
      subtitle={`Set up your tenant account for ${data.propertyName}`}
    >
      {/* Property preview card */}
      <div className="rounded-2xl border border-border bg-muted/40 p-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <p className="font-medium">{data.propertyName}</p>
            <p className="text-muted-foreground">Landlord: {data.landlordName}</p>
            <p className="text-muted-foreground">Monthly rent: <span className="text-foreground font-medium">{formatCurrency(data.monthlyRent)}</span></p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={data.email} disabled className="rounded-xl h-11" />
        </div>
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input className="rounded-xl h-11" placeholder="Your full name" {...form.register("fullName")} />
          {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" className="rounded-xl h-11" {...form.register("password")} />
          {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Confirm password</Label>
          <Input type="password" className="rounded-xl h-11" {...form.register("confirmPassword")} />
          {form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>}
        </div>

        {/* Server error banner */}
        {form.formState.errors.root && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{form.formState.errors.root.message}</span>
          </div>
        )}

        <Button type="submit" disabled={submit.isPending} className="w-full h-11 rounded-xl">
          {submit.isPending
            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            : <CheckCircle2 className="h-4 w-4 mr-2" />
          }
          Accept invite &amp; continue
        </Button>
      </form>
    </AuthShell>
  );
}
