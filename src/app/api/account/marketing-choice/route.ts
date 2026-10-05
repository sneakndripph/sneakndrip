import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-admin";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { applyMarketingChoice } from "@/lib/email/marketing-choice";

// /consent only offers the choice to accounts under NEW_ACCOUNT_WINDOW_MS old;
// this longer limit gives the user time to submit the form, while still keeping
// an established account from resetting its preferences through this route.
const SUBMIT_WINDOW_MS = 30 * 60_000;

/**
 * Applies the marketing choice ConsentForm just saved to user_metadata. Takes
 * no body: the choice is read from the signed-in user's own metadata.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(getIP(req), 10, 60_000).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (Date.now() - new Date(user.created_at).getTime() > SUBMIT_WINDOW_MS) {
    return NextResponse.json({ error: "Only available at sign-up" }, { status: 403 });
  }

  try {
    await applyMarketingChoice(user);
  } catch (err) {
    console.error("[marketing-choice] failed:", err);
    return NextResponse.json({ error: "Failed to save email preferences" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
