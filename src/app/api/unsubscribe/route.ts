import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/", req.url), 302);

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
