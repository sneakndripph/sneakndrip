import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "Missing from/to" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("count_unique_page_view_sessions", { range_start: from, range_end: to });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ count: data ?? 0 });
}
