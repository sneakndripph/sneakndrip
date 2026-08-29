import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { validateEnv } from "@/lib/env";

// Surface env misconfiguration in logs as early as possible. Never re-throw here —
// a bad env var must not take down every request; app/layout.tsx is the hard-fail path.
try {
  validateEnv();
} catch (err) {
  console.error("[middleware] env validation failed:", err);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let supabaseResponse = NextResponse.next({ request });
  let user: User | null = null;

  try {
    const env = validateEnv();
    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    // Fail closed: user stays null, so the route guards below deny access
    // rather than letting a broken env silently skip auth checks.
    console.error("[middleware] failed to resolve session:", err);
  }

  // Protect account page
  if (pathname.startsWith("/account") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect admin routes (skip the admin login page itself)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const isAdmin = user?.app_metadata?.role === "admin";
    if (!user || !isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Redirect authenticated admins away from admin login
  if (pathname === "/admin/login" && user?.app_metadata?.role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/login", "/register", "/admin/login"],
};
