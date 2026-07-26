"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeft,
  Menu,
  Search,
  Plus,
  Bell,
  Settings,
  ChevronDown,
  Sparkles,
  X,
  Circle,
} from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { useUI } from "./ui-provider";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/input";
import { Dropdown, MenuItem, MenuSeparator, MenuLabel } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import type { Momentum } from "@/lib/db/queries";

const COLLAPSE_KEY = "content-os:sidebar-collapsed";

export function AppShell({
  children,
  momentum,
}: {
  children: React.ReactNode;
  momentum: Momentum;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);
  React.useEffect(() => setMobileOpen(false), [pathname]);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });
  };

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-out lg:flex",
          collapsed ? "w-[68px]" : "w-[248px]",
        )}
      >
        <SidebarContent collapsed={collapsed} pathname={pathname} onToggle={toggleCollapse} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="absolute left-0 top-0 flex h-full w-[264px] flex-col border-r border-border bg-surface"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3.5 rounded-[var(--radius-sm)] p-1.5 text-faint hover:bg-surface-2 hover:text-fg"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
              <SidebarContent collapsed={false} pathname={pathname} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobile={() => setMobileOpen(true)} momentum={momentum} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  collapsed,
  pathname,
  onToggle,
}: {
  collapsed: boolean;
  pathname: string;
  onToggle?: () => void;
}) {
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <>
      <div className={cn("flex h-14 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-accent-fg">
          <Sparkles className="size-4.5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight text-fg">Content OS</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                collapsed && "justify-center px-0",
                active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent"
                  transition={{ duration: 0.2 }}
                />
              )}
              <item.icon className={cn("size-[18px] shrink-0", active ? "text-accent" : "")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-border px-3 py-3">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg",
            collapsed && "justify-center px-0",
            pathname.startsWith("/settings") && "bg-surface-2 text-fg",
          )}
        >
          <Settings className="size-[18px] shrink-0" />
          {!collapsed && "Settings"}
        </Link>
        <Link
          href="/settings"
          title={collapsed ? "Profile" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-surface-2",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-[12px] font-semibold text-accent-fg">
            Y
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-fg">You</span>
              <span className="block truncate text-[11px] text-faint">Creator</span>
            </span>
          )}
        </Link>
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "mt-1 flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px] font-medium text-faint transition-colors hover:bg-surface-2 hover:text-fg",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            {!collapsed && "Collapse"}
          </button>
        )}
      </div>
    </>
  );
}

function TopBar({ onOpenMobile, momentum }: { onOpenMobile: () => void; momentum: Momentum }) {
  const { openQuickAdd, openCommand } = useUI();

  const nudges = [
    momentum.scriptsReadyToRecord > 0 && {
      href: "/pipeline",
      text: `${momentum.scriptsReadyToRecord} script${momentum.scriptsReadyToRecord === 1 ? "" : "s"} ready to record`,
    },
    momentum.scheduledThisWeek > 0 && {
      href: "/calendar",
      text: `${momentum.scheduledThisWeek} post${momentum.scheduledThisWeek === 1 ? "" : "s"} scheduled this week`,
    },
    momentum.unconvertedReferences > 0 && {
      href: "/references",
      text: `${momentum.unconvertedReferences} reference${momentum.unconvertedReferences === 1 ? "" : "s"} not yet converted`,
    },
    momentum.staleIdeas > 0 && {
      href: "/ideas?age=stale",
      text: `${momentum.staleIdeas} idea${momentum.staleIdeas === 1 ? "" : "s"} untouched for 30+ days`,
    },
  ].filter(Boolean) as { href: string; text: string }[];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-bg/80 px-3 backdrop-blur-md sm:px-5">
      <button
        onClick={onOpenMobile}
        className="rounded-[var(--radius-sm)] p-2 text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <button
        onClick={openCommand}
        className="group flex h-9 max-w-md flex-1 items-center gap-2.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-left text-sm text-faint transition-colors hover:border-border-strong"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate">Search everything…</span>
        <span className="hidden items-center gap-1 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="flex items-center gap-1.5">
        <Button variant="primary" size="sm" className="hidden sm:inline-flex" onClick={() => openQuickAdd("idea")}>
          <Plus className="size-4" />
          New
        </Button>
        <Button variant="primary" size="icon-sm" className="sm:hidden" onClick={() => openQuickAdd("idea")} aria-label="Quick add">
          <Plus className="size-4" />
        </Button>

        <Dropdown
          trigger={
            <button
              className="relative rounded-[var(--radius-sm)] p-2 text-muted hover:bg-surface-2 hover:text-fg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
              {nudges.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent ring-2 ring-bg" />
              )}
            </button>
          }
          contentClassName="w-[300px]"
        >
          <MenuLabel>Content momentum</MenuLabel>
          {nudges.length === 0 ? (
            <p className="px-2.5 py-3 text-[13px] text-muted">You&apos;re all caught up. Nice.</p>
          ) : (
            nudges.map((n, i) => (
              <MenuItem key={i} icon={Circle} onClick={() => (window.location.href = n.href)}>
                <span className="text-[13px]">{n.text}</span>
              </MenuItem>
            ))
          )}
        </Dropdown>

        <Dropdown
          align="end"
          trigger={
            <button className="flex items-center gap-1.5 rounded-[var(--radius-sm)] p-1 pr-1.5 hover:bg-surface-2 transition-colors" aria-label="Profile menu">
              <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-[12px] font-semibold text-accent-fg">
                Y
              </span>
              <ChevronDown className="size-3.5 text-faint" />
            </button>
          }
          contentClassName="w-[240px]"
        >
          <div className="px-2.5 py-2">
            <p className="text-[13px] font-medium text-fg">You</p>
            <p className="text-[11px] text-faint">you@contentos.local</p>
          </div>
          <MenuSeparator />
          <div className="px-2.5 py-2">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-faint">Appearance</p>
            <ThemeToggle size="sm" />
          </div>
          <MenuSeparator />
          <MenuItem icon={Settings} onClick={() => (window.location.href = "/settings")}>
            Settings
          </MenuItem>
        </Dropdown>
      </div>
    </header>
  );
}
