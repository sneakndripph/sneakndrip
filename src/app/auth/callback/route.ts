import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { validateEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const cookieStore = await cookies();
  const env = validateEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  // OAuth (Google) and PKCE-based email confirmation land here with ?code=
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      // Catches the race the pre-signup check can't: signing up with a
      // password, then completing Google OAuth with the same email creates a
      // second auth.users row (see handle_new_user's `on conflict do nothing`
      // in 001_schema.sql — Supabase does not auto-link identities here).
      const admin = createAdminClient();
      const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const normalized = user.email.toLowerCase();
      const matches = (data?.users ?? []).filter(u => u.email?.toLowerCase() === normalized);

      if (matches.length > 1) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=duplicate_google`);
      }
    }

    return NextResponse.redirect(`${origin}${next ?? "/shop"}`);
  }

  // Email OTP links (recovery, signup, email_change, ...) land here with ?token_hash=&type=
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=link_expired`);
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}${next ?? "/reset-password"}`);
    }
    if (type === "signup" || type === "email") {
      return NextResponse.redirect(`${origin}/auth/callback/confirmed`);
    }
    if (type === "email_change") {
      return NextResponse.redirect(`${origin}/account?email_changed=1`);
    }

    return NextResponse.redirect(`${origin}${next ?? "/shop"}`);
  }

  return NextResponse.redirect(`${origin}${next ?? "/shop"}`);
}
