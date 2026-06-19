import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const BYPASS_PATHS = ["/admin", "/api", "/maintenance", "/_next", "/favicon", "/sneakndrip"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check maintenance mode (skip for admin, api, maintenance page itself, and static files)
  const isBypassed = BYPASS_PATHS.some(p => pathname.startsWith(p));
  if (!isBypassed) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      if (url && serviceKey) {
        const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
        const { data } = await supabase
          .from("store_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();
        if (data?.value === "true") {
          return NextResponse.redirect(new URL("/maintenance", req.url));
        }
      }
    } catch { /* fail open — don't block users if DB is unreachable */ }
  }

  // Admin route protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey,
        { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      const isAdmin = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
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
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.gif$|.*\\.ico$|.*\\.svg$).*)"],
};
