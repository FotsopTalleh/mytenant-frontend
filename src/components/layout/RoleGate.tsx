import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuthStore, type UserRole } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export function RoleGate({ role, children }: { role: UserRole; children: ReactNode }) {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  // SSR-safe mount guard.
  //
  // Problem: TanStack Start server-renders this component with no localStorage,
  // so Zustand persist reports hasHydrated()=false on the server. React 19
  // then preserves that `false` value during client hydration reconciliation to
  // avoid mismatches. The previous `onFinishHydration` subscription was silently
  // missed in Zustand v5 because hydration (sync localStorage read) completes
  // before the useEffect even runs, so the callback is never invoked.
  //
  // Fix: `mounted` starts false on both server and client (no mismatch).
  // useEffect only ever runs on the client. By the time it fires, Zustand has
  // already synchronously read localStorage and the store holds the real user.
  // The `_landlord` layout route is a persistent layout — RoleGate only mounts
  // ONCE per session, so the single-frame spinner is not visible on navigation.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!token || !user) return <Navigate to="/login" />;
  if (user.role !== role) {
    return <Navigate to={user.role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard"} />;
  }
  return <>{children}</>;
}
