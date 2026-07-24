"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
    >
      Sign out
    </button>
  );
}
