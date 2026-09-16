import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";
import { uuidSchema, emailSchema } from "@/lib/validation/schemas";

const restockNotifySchema = z.object({
  productId: uuidSchema,
  size: z.string().trim().min(1, "Missing fields").max(20, "Invalid fields"),
  email: emailSchema,
});

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 10, 60_000); // 10 notifications/min per IP
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const result = await validateBody(req, restockNotifySchema);
  if ("error" in result) return result.error;
  const { productId, size, email } = result.data;

  const admin = createAdminClient();
  const { error } = await admin
    .from("restock_notifications")
    .upsert({ product_id: productId, size, email }, { onConflict: "product_id,size,email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
