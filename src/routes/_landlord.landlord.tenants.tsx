import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_landlord/landlord/tenants")({
  head: () => ({ meta: [{ title: "Tenants — MyTenant" }] }),
  component: () => <ComingSoon title="Tenants" description="Invite, manage and message your tenants." />,
});
