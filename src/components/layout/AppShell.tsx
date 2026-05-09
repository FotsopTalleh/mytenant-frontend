import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, LayoutDashboard, LogOut, Menu, Moon, Sun, Users, Receipt, FileCheck, Bell } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface AppShellProps {
  variant: "landlord" | "tenant";
  children: ReactNode;
}

const landlordNav: NavItem[] = [
  { to: "/landlord/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/landlord/properties", label: "Properties", icon: Building2 },
  { to: "/landlord/tenants", label: "Tenants", icon: Users },
  { to: "/landlord/payments/review", label: "Payments", icon: FileCheck },
  { to: "/landlord/receipts", label: "Receipts", icon: Receipt },
  { to: "/landlord/notifications", label: "Notifications", icon: Bell },
];

const tenantNav: NavItem[] = [
  { to: "/tenant/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/tenant/upload", label: "Upload", icon: FileCheck },
  { to: "/tenant/payments", label: "Payments", icon: Receipt },
  { to: "/tenant/receipts", label: "Receipts", icon: Receipt },
  { to: "/tenant/notifications", label: "Alerts", icon: Bell },
];

export function AppShell({ variant, children }: AppShellProps) {
  const nav = variant === "landlord" ? landlordNav : tenantNav;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuthStore();
  const { theme, toggle, init } = useThemeStore();
  const unread = useNotificationStore((s) => s.unreadCount());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => init(), [init]);

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border">
          <BrandMark />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.label === "Notifications" && unread > 0 && (
                  <span className="text-[10px] font-semibold rounded-full bg-accent text-accent-foreground px-2 py-0.5">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
              {user?.name?.[0] ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Sign out"
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 flex items-center px-4 lg:px-8 gap-3">
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <BrandMark compact />
          </div>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-xl"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <motion.main
          key={path}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-10"
        >
          {children}
        </motion.main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur">
          <ul className="grid grid-cols-5">
            {nav.slice(0, 5).map((item) => {
              const active = path === item.to || path.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground p-4 flex flex-col"
            >
              <div className="h-12 flex items-center px-2 mb-2">
                <BrandMark />
              </div>
              <nav className="flex-1 space-y-1">
                {nav.map((item) => {
                  const active = path === item.to || path.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "hover:bg-sidebar-accent",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </motion.aside>
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
        <Building2 className="h-4 w-4" />
      </span>
      {!compact && <span className="text-base">MyTenant</span>}
    </Link>
  );
}
