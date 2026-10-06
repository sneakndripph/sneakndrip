import { NextRequest, NextResponse } from "next/server";
import { parseSignedUnsubscribe, applyUnsubscribe } from "@/lib/email/unsubscribe";

const INVALID_LINK = { error: "Invalid or expired unsubscribe link" };

/**
 * RFC 8058 one-click unsubscribe — the List-Unsubscribe header target. Mail
 * clients POST `List-Unsubscribe=One-Click`; the signed query string is the
 * only input, so the body is ignored. No IP rate limit: requests arrive from
 * shared Gmail/Yahoo infrastructure, the HMAC is the gate, and repeats are no-ops.
 */
export async function POST(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const signed = parseSignedUnsubscribe(params.get("email"), params.get("category"), params.get("sig"));
  if (!signed) return NextResponse.json(INVALID_LINK, { status: 400 });
  if (!(await applyUnsubscribe(signed))) return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** Clients without one-click support open the header URL — hand off to the /unsubscribe page, which applies it. */
export function GET(req: NextRequest) {
  const page = new URL("/unsubscribe", req.url);
  page.search = req.nextUrl.searchParams.toString();
  return NextResponse.redirect(page, 302);
}
