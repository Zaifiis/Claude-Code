import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, sessionIsValid, studioPassword } from "@/lib/studio/auth";
import { updateSession } from "@/lib/supabase/middleware";

/** Routes that Content Studio owns. */
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

/**
 * Content Studio keeps its own data and has no Supabase session. It is open by
 * default, which is what you want on your own machine; set `STUDIO_PASSWORD`
 * and it asks for that password once per device, which is what you want on a
 * public URL.
 */
async function studioGate(request: NextRequest) {
  if (studioPassword() === null) return NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  if (pathname === "/studio/login") return NextResponse.next({ request });

  if (await sessionIsValid(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next({ request });
  }

  // The app's own fetches should fail loudly rather than be handed an HTML
  // sign-in page they cannot parse.
  if (pathname.startsWith("/api/studio")) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/studio/login";
  url.search = "";
  return NextResponse.redirect(url);
}

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (function name `proxy`).
export async function proxy(request: NextRequest) {
  if (isStudioRoute(request.nextUrl.pathname)) {
    return studioGate(request);
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
