import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_tenant/tenant/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MyTenant" }] }),
  component: () => <ComingSoon title="Notifications" description="Approvals, reminders and alerts." />,
});
