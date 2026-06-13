import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();

  // Sanitize numeric/nullable fields when doing a full edit
  const update: Record<string, unknown> = { ...body };
  if ("value" in body) update.value = Number(body.value);
  if ("min_order" in body) update.min_order = Number(body.min_order) || 0;
  if ("max_uses" in body) update.max_uses = body.max_uses ? Number(body.max_uses) : null;
  if ("expires_at" in body) update.expires_at = body.expires_at || null;
  if ("code" in body) update.code = String(body.code).toUpperCase().trim();

  const { data, error } = await admin.from("coupons").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
