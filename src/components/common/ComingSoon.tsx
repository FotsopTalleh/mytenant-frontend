import { Sparkles } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-1">{description}</p>

      <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-10 lg:p-14 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-semibold">Shipping in the next phase</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          The full experience for this section is being built. The auth flows, navigation and design system are ready — we'll layer the rest in next.
        </p>
      </div>
    </div>
  );
}
