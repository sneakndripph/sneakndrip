import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function PATCH(req: NextRequest) {
  const { ids, status } = await req.json();
  if (!ids?.length || !status)
    return NextResponse.json({ error: "Missing ids or status" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ status })
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, updated: ids.length });
}
