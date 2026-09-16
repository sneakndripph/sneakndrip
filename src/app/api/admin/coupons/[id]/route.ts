import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { validateBody } from "@/lib/validation/validate";
import { couponUpdateSchema } from "@/lib/validation/schemas";

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await validateBody(req, couponUpdateSchema);
  if ("error" in result) return result.error;
  const body = result.data;
  const admin = createAdminClient();

  // Unknown keys (id, created_at, uses, etc.) are stripped by the schema rather
  // than reaching the DB update.
  const { data, error } = await admin.from("coupons").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { error: logError } = await admin.from("activity_log").insert({
      action: "coupon_updated",
      entity_type: "coupon",
      entity_id: id,
      entity_name: data?.code ?? null,
      actor_email: caller.email ?? null,
      details: { changed_fields: Object.keys(body) },
    });
    if (logError) console.error("[activity_log] insert failed:", logError);
  } catch (err) {
    console.error("[activity_log] insert failed:", err);
  }

  return NextResponse.json(data ?? { ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Params }) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data: existing } = await admin.from("coupons").select("code").eq("id", id).maybeSingle();
  const { error } = await admin.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { error: logError } = await admin.from("activity_log").insert({
      action: "coupon_deleted",
      entity_type: "coupon",
      entity_id: id,
      entity_name: existing?.code ?? null,
      actor_email: caller.email ?? null,
      details: null,
    });
    if (logError) console.error("[activity_log] insert failed:", logError);
  } catch (err) {
    console.error("[activity_log] insert failed:", err);
  }

  return NextResponse.json({ ok: true });
}
