import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CloudUpload,
  Bell,
  ShieldCheck,
  Receipt,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyTenant — Digital rent management for Africa" },
      {
        name: "description",
        content:
          "Collect rent, approve payments and issue digital receipts in minutes. Built for landlords and tenants across Africa.",
      },
      { property: "og:title", content: "MyTenant — Digital rent management" },
      {
        property: "og:description",
        content: "The simplest way to manage rent payments, receipts and reminders.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <BrandMark />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-border px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setOpen(false)} className="block text-sm">Features</a>
            <a href="#how" onClick={() => setOpen(false)} className="block text-sm">How it works</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="block text-sm">Pricing</a>
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1 rounded-xl">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="flex-1 rounded-xl">
                <Link to="/signup">Get started</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.48_0.09_187/0.12),transparent)]" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> Built for African landlords
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Manage rent payments without the stress.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              MyTenant gives landlords and tenants one shared place to upload payment proofs,
              approve them in a tap, and issue clean digital receipts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/signup">
                  Get started free <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> No card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Mobile-first</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 lg:px-8 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to run rent collection</h2>
          <p className="mt-3 text-muted-foreground">Designed for the way payments really happen — mobile money, bank transfer, cash receipts.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-card shadow-soft">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-muted/40 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">From property setup to receipt — it takes minutes.</p>
          </div>
          <ol className="mt-12 grid md:grid-cols-3 gap-8 relative">
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold">{s.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What our users say</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure key={t.name} className="p-6 rounded-2xl border border-border bg-card">
              <blockquote className="text-sm leading-relaxed text-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.location}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 lg:px-8 pb-20">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 lg:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-elevated">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Free while we're in beta.</h2>
            <p className="mt-2 text-primary-foreground/80 max-w-xl">
              Onboard your properties today and lock in early-access pricing forever.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="rounded-xl">
            <Link to="/signup">
              Create your account <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          <div>
            <BrandMark />
            <p className="mt-3 text-muted-foreground">Digital rent management for Africa.</p>
          </div>
          <div>
            <h4 className="font-medium mb-3">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#how" className="hover:text-foreground">How it works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Get the app</h4>
            <p className="text-muted-foreground">Add MyTenant to your home screen for one-tap access.</p>
          </div>
        </div>
        <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MyTenant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

const features = [
  { title: "Instant proof uploads", desc: "Tenants upload receipts from their phone in seconds.", icon: CloudUpload },
  { title: "One-click approvals", desc: "Review and approve payments without leaving the dashboard.", icon: CheckCircle2 },
  { title: "Digital receipts", desc: "Auto-generated PDF receipts the moment a payment is approved.", icon: Receipt },
  { title: "Smart reminders", desc: "Push notifications so rent is never late again.", icon: Bell },
  { title: "Multi-property support", desc: "Manage one unit or hundreds — same clean experience.", icon: Layers },
  { title: "Tenant portal", desc: "A dedicated mobile app for tenants to track their rent.", icon: Building2 },
];

const steps = [
  { title: "Landlord adds a property", desc: "Set monthly rent, due date and invite tenants by email." },
  { title: "Tenant uploads proof", desc: "Snap a photo or attach a receipt PDF in one tap." },
  { title: "Receipt is generated", desc: "Approve in a click and a digital receipt is issued instantly." },
];

const testimonials = [
  { quote: "Cut my admin time in half. I never lose track of who paid.", name: "Adaeze O.", location: "Lagos, Nigeria" },
  { quote: "My tenants love uploading receipts from their phones.", name: "Kwame B.", location: "Accra, Ghana" },
  { quote: "Receipts arrive instantly. It feels professional.", name: "Fatou D.", location: "Dakar, Senegal" },
];

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="rounded-3xl border border-border bg-card shadow-elevated overflow-hidden">
        <div className="h-10 bg-muted/60 border-b border-border flex items-center gap-1.5 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Properties", value: "12" },
              { label: "Tenants", value: "38" },
              { label: "This month", value: "₦2.4M" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/50 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className="mt-1 text-lg font-semibold">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Pending approvals</div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">4 new</span>
            </div>
            <div className="mt-3 space-y-2">
              {["Chinedu A. — Unit 4B", "Aisha M. — Unit 12", "Tunde O. — Unit 7A"].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <span>{t}</span>
                  <span className="text-primary font-medium">Review</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
