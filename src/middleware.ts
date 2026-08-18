import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

// Surface env misconfiguration in logs as early as possible. Never re-throw here —
// a bad env var must not take down every request; app/layout.tsx is the hard-fail path.
try {
  validateEnv();
} catch (err) {
  console.error("[middleware] env validation failed:", err);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin route protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    try {
      const env = validateEnv();
      const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} },
      });
      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = user?.app_metadata?.role === "admin";
      if (!user || !isAdmin) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.gif$|.*\\.ico$|.*\\.svg$|.*\\.webmanifest$).*)"],
};
