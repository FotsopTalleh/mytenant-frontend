import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RoleGate } from "@/components/layout/RoleGate";

export const Route = createFileRoute("/_landlord")({
  component: () => (
    <RoleGate role="landlord">
      <AppShell variant="landlord">
        <Outlet />
      </AppShell>
    </RoleGate>
  ),
});
