import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";
import { uuidSchema } from "@/lib/validation/schemas";

const wishlistSchema = z.object({ productId: uuidSchema });

export async function GET(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ wishlist: [] });

  const { data } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id);

  return NextResponse.json({ wishlist: (data ?? []).map(d => d.product_id) });
}

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const result = await validateBody(req, wishlistSchema);
  if ("error" in result) return result.error;
  const { productId } = result.data;

  await supabase.from("wishlists").upsert({ user_id: user.id, product_id: productId });

  const email = user.email;
  if (email) {
    const admin = createAdminClient();
    const { data: sizes } = await admin.from("product_sizes").select("size").eq("product_id", productId);
    if (sizes?.length) {
      await admin.from("restock_notifications").upsert(
        sizes.map(s => ({ product_id: productId, size: s.size, email, source: "wishlist" })),
        { onConflict: "product_id,size,email,source", ignoreDuplicates: true },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const result = await validateBody(req, wishlistSchema);
  if ("error" in result) return result.error;
  const { productId } = result.data;

  await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);

  if (user.email) {
    const admin = createAdminClient();
    await admin.from("restock_notifications").delete()
      .eq("product_id", productId).eq("email", user.email).eq("source", "wishlist");
  }

  return NextResponse.json({ ok: true });
}
