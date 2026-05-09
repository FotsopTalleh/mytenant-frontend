import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_tenant/tenant/payments")({
  head: () => ({ meta: [{ title: "Payments — MyTenant" }] }),
  component: () => <ComingSoon title="Payment history" description="See every payment you've submitted." />,
});
