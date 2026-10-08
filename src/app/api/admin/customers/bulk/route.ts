import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdminBulk } from "@/lib/supabase/require-admin-bulk";
import { listAllAuthUsers } from "@/lib/supabase/list-auth-users";
import { validateBody } from "@/lib/validation/validate";
import { customerBulkSchema } from "@/lib/validation/schemas";

type SkipReason = "not_found" | "guest" | "own_account" | "admin_account" | "update_failed";

// Same duration the single-customer ban uses (PATCH /api/admin/customers).
const BAN_DURATION = "87600h";

export async function POST(req: NextRequest) {
  const auth = await requireAdminBulk("customers");
  if ("error" in auth) return auth.error;

  const result = await validateBody(req, customerBulkSchema);
  if ("error" in result) return result.error;
  const { action } = result.data;
  const ids = [...new Set(result.data.ids)];
  const ban = action === "ban";

  const admin = createAdminClient();
  const { data: customers, error } = await admin
    .from("customers")
    .select("id, auth_user_id, full_name, email")
    .in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve auth ids server-side. Rows missing auth_user_id fall back to an email
  // match, mirroring how /admin/customers resolves them for display.
  const byId = new Map((customers ?? []).map(c => [c.id, c]));
  let authIdByEmail: Map<string, string> | null = null;
  if ((customers ?? []).some(c => !c.auth_user_id)) {
    const users = await listAllAuthUsers(admin);
    authIdByEmail = new Map(users.filter(u => u.email).map(u => [u.email!.toLowerCase(), u.id]));
  }

  const skipped: { id: string; reason: SkipReason }[] = [];
  const done: { id: string; authUserId: string; name: string | null }[] = [];

  for (const id of ids) {
    const c = byId.get(id);
    if (!c) { skipped.push({ id, reason: "not_found" }); continue; }

    const authUserId = c.auth_user_id ?? authIdByEmail?.get(c.email.toLowerCase()) ?? null;
    if (!authUserId) { skipped.push({ id, reason: "guest" }); continue; }

    if (ban && authUserId === auth.user.id) { skipped.push({ id, reason: "own_account" }); continue; }

    const { data: target, error: getError } = await admin.auth.admin.getUserById(authUserId);
    if (getError || !target?.user) { skipped.push({ id, reason: "guest" }); continue; }
    if (ban && target.user.app_metadata?.role === "admin") { skipped.push({ id, reason: "admin_account" }); continue; }

    const { error: banError } = await admin.auth.admin.updateUserById(authUserId, {
      ban_duration: ban ? BAN_DURATION : "none",
    });
    if (banError) {
      console.error(`[customers-bulk] ${action} ${authUserId} failed:`, banError);
      skipped.push({ id, reason: "update_failed" });
      continue;
    }
    done.push({ id, authUserId, name: c.full_name ?? null });
  }

  if (done.length) {
    try {
      const { error: logError } = await admin.from("activity_log").insert(
        done.map(d => ({
          action: ban ? "customer_banned" : "customer_unbanned",
          entity_type: "customer",
          entity_id: d.authUserId,
          entity_name: d.name,
          actor_email: auth.user.email ?? null,
          details: { bulk: true },
        })),
      );
      if (logError) console.error("[activity_log] bulk insert failed:", logError);
    } catch (err) {
      console.error("[activity_log] bulk insert failed:", err);
    }
  }

  return NextResponse.json({ updated: done.length, skipped, ids: done.map(d => d.id) });
}
