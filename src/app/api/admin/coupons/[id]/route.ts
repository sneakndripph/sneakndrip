import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdmin } from "@/lib/supabase/require-admin";

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();

  const update: Record<string, unknown> = { ...body };
  if ("value" in body) update.value = Number(body.value);
  if ("min_order" in body) update.min_order = Number(body.min_order) || 0;
  if ("max_uses" in body) update.max_uses = body.max_uses ? Number(body.max_uses) : null;
  if ("expires_at" in body) update.expires_at = body.expires_at || null;
  if ("code" in body) update.code = String(body.code).toUpperCase().trim();

  const { data, error } = await admin.from("coupons").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void admin.from("activity_log").insert({
    action: "coupon_updated",
    entity_type: "coupon",
    entity_id: id,
    entity_name: data?.code ?? null,
    actor_email: caller.email ?? null,
    details: { changed_fields: Object.keys(body) },
  });

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

  void admin.from("activity_log").insert({
    action: "coupon_deleted",
    entity_type: "coupon",
    entity_id: id,
    entity_name: existing?.code ?? null,
    actor_email: caller.email ?? null,
    details: null,
  });

  return NextResponse.json({ ok: true });
}
