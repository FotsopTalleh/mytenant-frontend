import { useEffect, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuthStore, type UserRole } from "@/store/authStore";

export function RoleGate({ role, children }: { role: UserRole; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // Avoid SSR mismatch — render on client only
  useEffect(() => {}, []);

  if (!token || !user) return <Navigate to="/login" />;
  if (user.role !== role) {
    return <Navigate to={user.role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard"} />;
  }
  return <>{children}</>;
}
