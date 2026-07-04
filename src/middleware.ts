import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE_BYPASS = ["/admin", "/api", "/maintenance", "/_next", "/favicon", "/sneakndrip-logo", "/icon"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Maintenance mode — direct REST fetch (more reliable in Edge Runtime than @supabase/ssr)
  const shouldCheck = !MAINTENANCE_BYPASS.some(p => pathname.startsWith(p));
  if (shouldCheck) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/store_settings?key=eq.maintenance_mode&select=value&limit=1`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const rows = await res.json() as Array<{ value: string }>;
        if (rows[0]?.value === "true") {
          return NextResponse.redirect(new URL("/maintenance", req.url));
        }
      }
    } catch { /* fail open */ }
  }

  // Admin route protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    try {
      const supabase = createServerClient(supabaseUrl, anonKey, {
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
