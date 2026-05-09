import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_landlord/landlord/receipts")({
  head: () => ({ meta: [{ title: "Receipts — MyTenant" }] }),
  component: () => <ComingSoon title="Receipts" description="Download and share digital receipts." />,
});
