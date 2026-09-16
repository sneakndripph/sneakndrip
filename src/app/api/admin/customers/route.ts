import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";
import { validateBody } from "@/lib/validation/validate";
import { customerBanSchema } from "@/lib/validation/schemas";

async function requireAdmin() {
  try {
    const cookieStore = await cookies();
    const env = validateEnv();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.app_metadata?.role === "admin";
    if (!user || !isAdmin) return null;
    return user;
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await validateBody(req, customerBanSchema);
  if ("error" in result) return result.error;
  const { userId, ban } = result.data;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: ban ? "87600h" : "none",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { error: logError } = await admin.from("activity_log").insert({
      action: ban ? "customer_banned" : "customer_unbanned",
      entity_type: "customer",
      entity_id: userId,
      actor_email: caller.email ?? null,
      details: null,
    });
    if (logError) console.error("[activity_log] insert failed:", logError);
  } catch (err) {
    console.error("[activity_log] insert failed:", err);
  }

  return NextResponse.json({ ok: true });
}
