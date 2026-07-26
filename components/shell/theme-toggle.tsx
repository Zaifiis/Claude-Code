"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Segmented } from "@/components/ui/segmented";

export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Segmented
      size={size}
      ariaLabel="Theme"
      value={mounted ? (theme as "light" | "dark" | "system") ?? "system" : "system"}
      onChange={(v) => setTheme(v)}
      options={[
        { value: "light", icon: Sun },
        { value: "system", icon: Monitor },
        { value: "dark", icon: Moon },
      ]}
    />
  );
}
