import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextResponse } from "next/server";

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_settings")
    .select("key, value")
    .eq("key", "maintenance_mode");
  return NextResponse.json({ data, error, env_has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY });
}
