import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from("coupons")
    .select("code, type, value, min_order, expires_at, max_uses, uses")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false });

  const active = (data ?? []).filter(c => c.max_uses === null || c.uses < c.max_uses);

  return NextResponse.json(active);
}
