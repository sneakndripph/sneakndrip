import { requireAdmin } from "@/lib/supabase/require-admin";
import { NextResponse } from "next/server";

// Temporary debug: shows exactly what the middleware reads from Supabase
export async function GET() {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // Exactly what middleware does
  const url = `${supabaseUrl}/rest/v1/store_settings?key=eq.maintenance_mode&select=value&limit=1`;
  let rows: unknown = null;
  let fetchOk = false;
  let fetchStatus = 0;
  let fetchError: string | null = null;

  try {
    const res = await fetch(url, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      cache: "no-store",
    });
    fetchOk = res.ok;
    fetchStatus = res.status;
    rows = await res.json();
  } catch (e) {
    fetchError = String(e);
  }

  return NextResponse.json({
    url: url.replace(anonKey, "***"),
    anonKeyPresent: !!anonKey,
    supabaseUrlPresent: !!supabaseUrl,
    fetchOk,
    fetchStatus,
    fetchError,
    rows,
  });
}
