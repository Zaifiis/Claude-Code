import { NavLinks } from "./nav-links";
import { SignOutButton } from "./sign-out-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-neutral-800 bg-neutral-950 p-4">
        <div>
          <div className="mb-6 px-2">
            <p className="text-sm font-semibold text-neutral-100">Content Automation</p>
            <p className="text-xs text-neutral-500">Powered by n8n</p>
          </div>
          <NavLinks />
        </div>
        <SignOutButton />
      </aside>
      <main className="flex-1 bg-neutral-950 p-8">{children}</main>
    </div>
  );
}
