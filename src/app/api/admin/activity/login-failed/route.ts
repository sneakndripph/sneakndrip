import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";

// Unauthenticated by necessity (the caller failed to sign in). Only logs when the
// attempted email belongs to an admin account, to avoid recording every customer typo.
export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 5, 60_000);
  if (!allowed) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null) as { email?: string; reason?: string } | null;
  const email = body?.email;
  if (!email || typeof email !== "string") return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error || !data) return NextResponse.json({ ok: true });

  const target = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (target?.app_metadata?.role === "admin") {
    try {
      const { error: logError } = await admin.from("activity_log").insert({
        action: "admin_login_failed",
        entity_type: "auth_attempt",
        entity_id: null,
        entity_name: email,
        actor_email: null,
        details: body?.reason ? { reason: body.reason } : null,
      });
      if (logError) console.error("[activity_log] insert failed:", logError);
    } catch (err) {
      console.error("[activity_log] insert failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
