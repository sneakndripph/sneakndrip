import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("inventory_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return NextResponse.json(data ?? []);
}
