import {
  LayoutDashboard,
  Inbox,
  Lightbulb,
  PenLine,
  Kanban,
  Calendar,
  Library,
  Bookmark,
  BarChart3,
  Archive,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/scripts", label: "Scripts", icon: PenLine },
  { href: "/pipeline", label: "Content Pipeline", icon: Kanban },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/library", label: "Content Library", icon: Library },
  { href: "/references", label: "References", icon: Bookmark },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/archive", label: "Archive", icon: Archive },
];
