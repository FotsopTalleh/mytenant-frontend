import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth.api";
import { forgotSchema, type ForgotInput } from "@/lib/schemas/auth.schemas";
import { AuthShell } from "@/components/layout/AuthShell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — MyTenant" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const form = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });
  const send = useMutation({ mutationFn: (v: ForgotInput) => authApi.forgotPassword(v.email) });

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a link to reset it."
      footer={
        <Link to="/login" className="text-sm text-primary hover:underline">Back to sign in</Link>
      }
    >
      {send.isSuccess ? (
        <div className="flex flex-col items-center text-center py-6 gap-3">
          <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center">
            <MailCheck className="h-6 w-6" />
          </div>
          <p className="font-medium">Check your inbox</p>
          <p className="text-sm text-muted-foreground">If an account exists for that email, a reset link is on its way.</p>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit((v) => send.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" className="rounded-xl h-11" placeholder="you@example.com" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <Button type="submit" disabled={send.isPending} className="w-full h-11 rounded-xl">
            {send.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
