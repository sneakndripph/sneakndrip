import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { validateEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { consentMetadata, hasCurrentConsent } from "@/lib/legal/versions";
import { safeNext } from "@/lib/safe-redirect";
import { applyMarketingChoice, isNewAccount } from "@/lib/email/marketing-choice";

/** Sign-in must never fail over email preferences; a failed apply is retried next sign-in. */
async function applyMarketingChoiceSafely(user: User): Promise<void> {
  try {
    await applyMarketingChoice(user);
  } catch (err) {
    console.error("[marketing-choice] failed:", err);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Raw ?next= — always pass through safeNext() before redirecting (open-redirect guard)
  const rawNext = searchParams.get("next");
  const next = safeNext(rawNext);

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

    // Terms/Privacy consent gate. /register only starts Google OAuth once the
    // consent box is ticked and tags the redirect with ?consent=register, so
    // record it here (server time). Anyone else without current-version
    // consent (e.g. a new Google user from /login) must accept on /consent.
    // Existing current-version records are left alone to keep the original timestamp.
    let signedInUser = user;
    if (user && !hasCurrentConsent(user.user_metadata)) {
      const consentNext = `${origin}/consent?next=${encodeURIComponent(next)}`;
      if (searchParams.get("consent") !== "register") {
        return NextResponse.redirect(consentNext);
      }
      // /register adds &marketing=1 when its opt-in box is ticked. Only a brand-new
      // account records the choice, so an existing user re-consenting here keeps
      // their current email preferences.
      const marketing = isNewAccount(user) ? { marketing_opted_in: searchParams.get("marketing") === "1" } : {};
      const { data, error } = await supabase.auth.updateUser({ data: { ...consentMetadata("register"), ...marketing } });
      if (error) return NextResponse.redirect(consentNext);
      signedInUser = data.user;
    }

    // Covers Google sign-up from /register and PKCE email confirmation; a no-op
    // for accounts with no pending sign-up choice.
    if (signedInUser) await applyMarketingChoiceSafely(signedInUser);

    return NextResponse.redirect(`${origin}${next}`);
  }

  // Email OTP links (recovery, signup, email_change, ...) land here with ?token_hash=&type=
  if (tokenHash && type) {
    const { data: otpData, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=link_expired`);
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}${safeNext(rawNext, "/reset-password")}`);
    }
    if (type === "signup" || type === "email") {
      if (otpData.user) await applyMarketingChoiceSafely(otpData.user);
      return NextResponse.redirect(`${origin}/auth/callback/confirmed`);
    }
    if (type === "email_change") {
      return NextResponse.redirect(`${origin}/account?email_changed=1`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
