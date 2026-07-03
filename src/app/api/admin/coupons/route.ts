import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET() {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();
  const { data, error } = await admin.from("coupons").insert({
    code: (body.code as string).toUpperCase().trim(),
    type: body.type,
    value: Number(body.value),
    min_order: Number(body.min_order) || 0,
    max_uses: body.max_uses ? Number(body.max_uses) : null,
    expires_at: body.expires_at || null,
    is_active: true,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void admin.from("activity_log").insert({
    action: "coupon_created",
    entity_type: "coupon",
    entity_id: data.id,
    entity_name: data.code,
    actor_email: caller.email ?? null,
    details: null,
  });

  return NextResponse.json(data, { status: 201 });
}
