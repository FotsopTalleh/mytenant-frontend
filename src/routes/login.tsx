import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth.api";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth.schemas";
import { useAuthStore } from "@/store/authStore";
import { AuthShell } from "@/components/layout/AuthShell";
import { GoogleButton } from "@/components/common/GoogleButton";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — MyTenant" },
      { name: "description", content: "Sign in to manage your rent payments." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const login = useMutation({
    mutationFn: (v: LoginInput) => authApi.login(v.email, v.password),
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      navigate({ to: user.role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard" });
    },
  });

  const google = useMutation({
    mutationFn: () => authApi.googleLogin("mock-credential"),
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      navigate({ to: user.role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard" });
    },
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your MyTenant account"
      footer={
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={form.handleSubmit((v) => login.mutate(v))} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="rounded-xl h-11"
            aria-invalid={!!form.formState.errors.email}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-xl h-11 pr-10"
              aria-invalid={!!form.formState.errors.password}
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        {login.isError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{(login.error as { message?: string })?.message || "Sign in failed"}</span>
          </motion.div>
        )}

        <Button type="submit" disabled={login.isPending} className="w-full h-11 rounded-xl">
          {login.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Sign in
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <GoogleButton onClick={() => google.mutate()} loading={google.isPending} label="Continue with Google" />

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          Tip: emails starting with "tenant" sign in as a tenant.
        </p>
      </form>
    </AuthShell>
  );
}
