import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_landlord/landlord/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MyTenant" }] }),
  component: () => <ComingSoon title="Notifications" description="Stay on top of approvals and reminders." />,
});
