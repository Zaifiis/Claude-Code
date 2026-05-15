"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, TrendingUp, Bookmark, Search,
  Settings, Shield, LogOut, Zap, ChevronLeft, ChevronRight
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: TrendingUp },
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
];

interface SidebarProps {
  isAdmin?: boolean;
  userPlan?: string;
}

export function Sidebar({ isAdmin, userPlan }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "flex flex-col bg-slate-950 text-white transition-all duration-200 flex-shrink-0 h-screen sticky top-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-white text-base">AdSpy PK</span>
            <span className={cn(
              "ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium",
              userPlan === "PRO" ? "bg-amber-500 text-white" : "bg-slate-700 text-slate-300"
            )}>
              {userPlan ?? "FREE"}
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "sidebar-link",
                active && "active",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className={cn("pt-3 pb-1", !collapsed && "px-2")}>
              {!collapsed && <p className="text-xs text-slate-600 font-medium uppercase tracking-wider">Admin</p>}
            </div>
            {adminLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn("sidebar-link", active && "active", collapsed && "justify-center px-2")}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-950/30",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
