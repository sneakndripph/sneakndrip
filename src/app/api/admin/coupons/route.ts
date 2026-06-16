import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getRequestingUser();
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
    actor_email: user?.email ?? null,
    details: null,
  });

  return NextResponse.json(data, { status: 201 });
}
