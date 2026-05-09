import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/_landlord/landlord/properties")({
  head: () => ({ meta: [{ title: "Properties — MyTenant" }] }),
  component: () => (
    <ComingSoon
      title="Properties"
      description="Add, edit and manage all your properties in one place. Coming in the next phase."
    />
  ),
});
