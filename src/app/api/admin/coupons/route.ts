import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { validateBody } from "@/lib/validation/validate";
import { couponCreateSchema } from "@/lib/validation/schemas";

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

  const result = await validateBody(req, couponCreateSchema);
  if ("error" in result) return result.error;
  const body = result.data;

  const admin = createAdminClient();
  const { data, error } = await admin.from("coupons").insert({
    code: body.code,
    type: body.type,
    value: body.value,
    min_order: body.min_order,
    max_uses: body.max_uses,
    expires_at: body.expires_at,
    is_active: true,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { error: logError } = await admin.from("activity_log").insert({
      action: "coupon_created",
      entity_type: "coupon",
      entity_id: data.id,
      entity_name: data.code,
      actor_email: caller.email ?? null,
      details: null,
    });
    if (logError) console.error("[activity_log] insert failed:", logError);
  } catch (err) {
    console.error("[activity_log] insert failed:", err);
  }

  return NextResponse.json(data, { status: 201 });
}
