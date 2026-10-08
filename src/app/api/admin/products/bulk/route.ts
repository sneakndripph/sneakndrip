import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { rateLimit } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validation/validate";
import { productBulkDeleteSchema, productBulkUpdateSchema } from "@/lib/validation/schemas";

// Bulk writes touch up to 200 products per call; keyed per admin rather than per IP.
const BULK_LIMIT = 10;
const BULK_WINDOW_MS = 60_000;

async function authorize(): Promise<{ user: User } | { error: NextResponse }> {
  const user = await requireAdmin();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { allowed } = await rateLimit(`admin-products-bulk:${user.id}`, BULK_LIMIT, BULK_WINDOW_MS);
  if (!allowed) {
    return { error: NextResponse.json({ error: "Too many bulk actions. Try again in a minute." }, { status: 429 }) };
  }
  return { user };
}

async function logActivity(
  action: string,
  rows: { id: string; name: string | null }[],
  actorEmail: string | null,
  details: Record<string, unknown> | null,
) {
  if (!rows.length) return;
  try {
    const { error } = await createAdminClient().from("activity_log").insert(
      rows.map(r => ({
        action,
        entity_type: "product",
        entity_id: r.id,
        entity_name: r.name,
        actor_email: actorEmail,
        details,
      })),
    );
    if (error) console.error("[activity_log] bulk insert failed:", error);
  } catch (err) {
    console.error("[activity_log] bulk insert failed:", err);
  }
}

// Intentionally never calls sendNewArrivalBroadcast and never touches notified_at:
// bulk publishing must not email subscribers.
export async function PATCH(req: NextRequest) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;

  const result = await validateBody(req, productBulkUpdateSchema);
  if ("error" in result) return result.error;
  const { ids, patch } = result.data;

  const { data, error } = await createAdminClient()
    .from("products")
    .update(patch)
    .in("id", ids)
    .select("id, name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  await logActivity("product_bulk_updated", rows, auth.user.email ?? null, { patch, count: rows.length });

  return NextResponse.json({ updated: rows.length, ids: rows.map(r => r.id), names: rows.map(r => r.name) });
}

export async function DELETE(req: NextRequest) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;

  const result = await validateBody(req, productBulkDeleteSchema);
  if ("error" in result) return result.error;
  const { ids } = result.data;

  const { data, error } = await createAdminClient()
    .from("products")
    .delete()
    .in("id", ids)
    .select("id, name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  await logActivity("product_deleted", rows, auth.user.email ?? null, { bulk: true });

  return NextResponse.json({ deleted: rows.length, ids: rows.map(r => r.id), names: rows.map(r => r.name) });
}
