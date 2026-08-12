import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextResponse } from "next/server";

const PUBLIC_KEYS = new Set([
  "gcash_number", "gcash_name", "gcash_qr_url",
  "maya_number", "maya_name", "maya_qr_url",
  "bank1_name", "bank1_account_number", "bank1_account_name", "bank1_qr_url",
  "bank2_name", "bank2_account_number", "bank2_account_name", "bank2_qr_url",
  "cod_enabled", "cod_areas",
  "free_shipping_threshold", "metro_shipping_fee", "provincial_shipping_fee",
  "cod_metro_sm", "cod_metro_lg", "cod_vm_sm", "cod_vm_lg",
  "chat_widget_enabled",
  "context_bar_enabled",
  "new_arrivals_enabled",
  "buying_floor_enabled",
  "trending_enabled",
  "reviews_enabled",
  "newsletter_enabled",
]);

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_settings")
    .select("key, value")
    .in("key", [...PUBLIC_KEYS]);

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value;
  return NextResponse.json(settings);
}
