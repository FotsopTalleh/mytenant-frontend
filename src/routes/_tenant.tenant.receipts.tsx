import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_tenant/tenant/receipts")({
  head: () => ({ meta: [{ title: "Receipts — MyTenant" }] }),
  component: () => <ComingSoon title="Receipts" description="Download your approved receipts as PDF." />,
});
