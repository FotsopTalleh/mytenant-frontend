import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_landlord/landlord/payments/review")({
  head: () => ({ meta: [{ title: "Payment review — MyTenant" }] }),
  component: () => <ComingSoon title="Payment review" description="Approve or reject incoming payment proofs." />,
});
