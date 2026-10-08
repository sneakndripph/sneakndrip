import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { validateBody } from "@/lib/validation/validate";
import { customerBanSchema } from "@/lib/validation/schemas";

export async function PATCH(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await validateBody(req, customerBanSchema);
  if ("error" in result) return result.error;
  const { userId, ban } = result.data;

  const admin = createAdminClient();

  // userId must be an auth user id. Guest-checkout customers have no login account,
  // and a customers.id here would otherwise surface as an opaque 500.
  const { data: target, error: getError } = await admin.auth.admin.getUserById(userId);
  if (getError || !target?.user) {
    return NextResponse.json({ error: "This customer has no login account to ban (guest checkout)." }, { status: 404 });
  }

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
