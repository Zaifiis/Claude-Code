import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Routes that Content Studio owns; see the early return in `proxy` below. */
function isStudioRoute(pathname: string): boolean {
  return (
    pathname === "/studio" ||
    pathname.startsWith("/studio/") ||
    pathname === "/api/studio" ||
    pathname.startsWith("/api/studio/")
  );
}

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (function name `proxy`).
export async function proxy(request: NextRequest) {
  // Content Studio stores its ideas in a local file rather than Supabase, so
  // it stays reachable with no environment configuration and no sign-in. The
  // n8n dashboard routes keep their Supabase session gate.
  if (isStudioRoute(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
