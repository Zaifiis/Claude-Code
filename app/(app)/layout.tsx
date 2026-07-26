import { AppShell } from "@/components/shell/app-shell";
import { getMomentum } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const momentum = getMomentum();
  return <AppShell momentum={momentum}>{children}</AppShell>;
}
