import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { path, session_id } = await req.json();
    const admin = createAdminClient();
    await admin.from("page_views").insert({ path: path ?? "/", session_id: session_id ?? null });
  } catch { /* silently ignore — never break the store */ }
  return NextResponse.json({ ok: true });
}
