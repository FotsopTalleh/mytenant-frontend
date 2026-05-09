import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BrandMark } from "@/components/layout/AppShell";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 lg:px-8 h-16 flex items-center">
        <BrandMark />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md rounded-3xl border border-border bg-card shadow-soft p-7"
        >
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center">{footer}</div>}
        </motion.div>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">← Back to homepage</Link>
      </footer>
    </div>
  );
}
