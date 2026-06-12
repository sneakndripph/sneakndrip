import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function POST(req: NextRequest) {
  const { productId, size, email } = await req.json();
  if (!productId || !size || !email)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("restock_notifications")
    .upsert({ product_id: productId, size, email }, { onConflict: "product_id,size,email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
