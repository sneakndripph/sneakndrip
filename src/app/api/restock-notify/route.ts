import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 10, 60_000); // 10 notifications/min per IP
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { productId, size, email } = await req.json();
  if (!productId || !size || !email)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (String(productId).length > 36 || String(size).length > 20 || String(email).length > 254)
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)))
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("restock_notifications")
    .upsert({ product_id: productId, size, email }, { onConflict: "product_id,size,email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
