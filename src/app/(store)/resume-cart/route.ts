import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/require-admin";

// Cart abandonment emails link here instead of straight to /cart — at
// send-time we can't know whether the click will land in a signed-in
// session, so this resolves it at click-time instead.
//
// A route handler (rather than a page + redirect()) so we can attach
// explicit no-cache headers: the link is identical for every recipient, so
// an intermediate cache keyed on the URL alone could otherwise capture one
// user's redirect (e.g. to /cart) and replay it to a different,
// unauthenticated user.
export async function GET(request: NextRequest) {
  const user = await requireUser();
  const destination = user ? "/cart" : "/login?redirect=/cart";

  const response = NextResponse.redirect(new URL(destination, request.url), 307);
  response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  response.headers.set("Vary", "Cookie");
  response.headers.set("Pragma", "no-cache");
  return response;
}
