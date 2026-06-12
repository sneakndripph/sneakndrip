import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
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
  return NextResponse.json(data, { status: 201 });
}
