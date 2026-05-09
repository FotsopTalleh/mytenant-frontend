import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authApi } from "@/api/auth.api";
import { signupSchema, type SignupInput } from "@/lib/schemas/auth.schemas";
import { useAuthStore } from "@/store/authStore";
import { AuthShell } from "@/components/layout/AuthShell";
import { GoogleButton } from "@/components/common/GoogleButton";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — MyTenant" },
      { name: "description", content: "Sign up as a landlord and start collecting rent digitally." },
    ],
  }),
  component: SignupPage,
});

const dialCodes = [
  { code: "+234", label: "🇳🇬 +234" },
  { code: "+233", label: "🇬🇭 +233" },
  { code: "+254", label: "🇰🇪 +254" },
  { code: "+27", label: "🇿🇦 +27" },
  { code: "+221", label: "🇸🇳 +221" },
];

function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", phoneCountry: "+234", phone: "", password: "", confirmPassword: "" },
  });

  const signup = useMutation({
    mutationFn: (v: SignupInput) =>
      authApi.signupLandlord({
        fullName: v.fullName,
        email: v.email,
        phone: `${v.phoneCountry}${v.phone}`,
        password: v.password,
      }),
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      navigate({ to: "/landlord/dashboard" });
    },
  });

  const google = useMutation({
    mutationFn: () => authApi.googleLogin("mock-credential"),
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      navigate({ to: "/landlord/dashboard" });
    },
  });

  const phoneCountry = form.watch("phoneCountry");

  return (
    <AuthShell
      title="Create your landlord account"
      subtitle="Onboard your properties in minutes"
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={form.handleSubmit((v) => signup.mutate(v))} className="space-y-4" noValidate>
        <Field label="Full name" error={form.formState.errors.fullName?.message}>
          <Input className="rounded-xl h-11" placeholder="Adaeze Okafor" {...form.register("fullName")} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" className="rounded-xl h-11" placeholder="you@example.com" {...form.register("email")} />
        </Field>
        <Field label="Phone" error={form.formState.errors.phone?.message}>
          <div className="flex gap-2">
            <Select value={phoneCountry} onValueChange={(v) => form.setValue("phoneCountry", v)}>
              <SelectTrigger className="rounded-xl h-11 w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {dialCodes.map((d) => (
                  <SelectItem key={d.code} value={d.code}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="tel" className="rounded-xl h-11 flex-1" placeholder="801 234 5678" {...form.register("phone")} />
          </div>
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              className="rounded-xl h-11 pr-10"
              placeholder="At least 8 characters"
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
        </Field>
        <Field label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
          <Input type="password" className="rounded-xl h-11" {...form.register("confirmPassword")} />
        </Field>

        {signup.isError && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{(signup.error as { message?: string })?.message || "Sign up failed"}</span>
          </div>
        )}

        <Button type="submit" disabled={signup.isPending} className="w-full h-11 rounded-xl">
          {signup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create account
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>
        <GoogleButton onClick={() => google.mutate()} loading={google.isPending} label="Continue with Google" />
      </form>
    </AuthShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
