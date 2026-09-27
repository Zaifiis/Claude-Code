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

/** The n8n dashboard cannot do anything without a Supabase project behind it. */
function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (function name `proxy`).
export async function proxy(request: NextRequest) {
  // Content Studio stores its ideas in a local file rather than Supabase, so
  // it stays reachable with no environment configuration and no sign-in.
  if (isStudioRoute(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  // With no Supabase credentials the n8n dashboard can only throw, so send
  // people to the part of the app that runs unconfigured instead of showing
  // them a stack trace. Once the credentials are set this never fires and the
  // session gate below applies as normal.
  if (!supabaseConfigured()) {
    const url = request.nextUrl.clone();
    url.pathname = "/studio";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
