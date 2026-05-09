import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_tenant/tenant/upload")({
  head: () => ({ meta: [{ title: "Upload payment — MyTenant" }] }),
  component: () => <ComingSoon title="Upload payment proof" description="Drag & drop or take a photo of your receipt." />,
});
