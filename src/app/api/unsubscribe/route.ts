import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { parseSignedUnsubscribe, applyUnsubscribe, applyResubscribe } from "@/lib/email/unsubscribe";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";

const unsubscribeTokenSchema = z.string().trim().min(1);

const INVALID_LINK = { error: "Invalid or expired unsubscribe link" };

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // Signed one-click link (?email=&category=&sig=). Emails link straight to
  // the /unsubscribe page, which applies it itself; this path serves direct
  // or programmatic hits and lands on the same page.
  if (params.has("sig")) {
    if (!(await rateLimit(`unsubscribe:${getIP(req)}`, 30, 60_000)).allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const signed = parseSignedUnsubscribe(params.get("email"), params.get("category"), params.get("sig"));
    if (!signed) return NextResponse.json(INVALID_LINK, { status: 400 });
    if (!(await applyUnsubscribe(signed))) {
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
    }
    const page = new URL("/unsubscribe", req.url);
    page.search = params.toString();
    return NextResponse.redirect(page, 302);
  }

  // Legacy newsletter token link (migration 039) — kept for emails already sent.
  const rawToken = params.get("token");
  const parsed = unsubscribeTokenSchema.safeParse(rawToken);
  if (!parsed.success) return NextResponse.redirect(new URL("/", req.url), 302);
  const token = parsed.data;

  const admin = createAdminClient();
  const { data: subscriber } = await admin
    .from("newsletter_subscribers")
    .select("id, unsubscribed_at")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!subscriber) {
    return NextResponse.json({ error: "Invalid or expired unsubscribe link" }, { status: 404 });
  }

  if (!subscriber.unsubscribed_at) {
    await admin
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("id", subscriber.id);
  }

  return NextResponse.redirect(new URL("/unsubscribe", req.url), 302);
}

const resubscribeSchema = z.object({
  email: z.string().min(1),
  category: z.string().min(1),
  sig: z.string().min(1),
});

/** Resubscribe from the /unsubscribe page, authorised by the same signed payload. */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`unsubscribe:${getIP(req)}`, 30, 60_000)).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const result = await validateBody(req, resubscribeSchema);
  if ("error" in result) return result.error;
  const signed = parseSignedUnsubscribe(result.data.email, result.data.category, result.data.sig);
  if (!signed) return NextResponse.json(INVALID_LINK, { status: 400 });

  const outcome = await applyResubscribe(signed);
  if (!outcome) return NextResponse.json({ error: "Failed to resubscribe" }, { status: 500 });
  return NextResponse.json({ success: true, ...outcome });
}
