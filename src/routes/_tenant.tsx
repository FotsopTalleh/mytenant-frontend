import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_tenant")({
  component: () => (
    <RoleGate role="tenant">
      <AppShell variant="tenant">
        <Outlet />
      </AppShell>
    </RoleGate>
  ),
});
