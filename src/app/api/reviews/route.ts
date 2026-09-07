import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const product_id = searchParams.get("product_id");
  const author_name = searchParams.get("author_name");
  if (!product_id || !author_name) return NextResponse.json({ review: null });

  const admin = createAdminClient();
  const { data } = await admin
    .from("reviews")
    .select("id, rating, title, body")
    .eq("product_id", product_id)
    .eq("author_name", author_name)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ review: data ?? null });
}

export async function PATCH(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 10, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id, rating, title, body, image_url } = await req.json() as { id?: string; rating?: number; title?: string; body?: string; image_url?: string | null };
  if (!id || !body?.trim()) return NextResponse.json({ error: "Missing id or body" }, { status: 400 });
  if (typeof rating !== "number" || rating < 1 || rating > 5) return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  if (body.length > 2000) return NextResponse.json({ error: "Review too long" }, { status: 400 });
  if (title && title.length > 200) return NextResponse.json({ error: "Title too long" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("reviews").update({ rating, title: title?.trim() ?? null, body: body.trim(), image_url: image_url ?? null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 10, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });

  const body = await req.json() as {
    product_id?: string;
    author_name: string;
    rating: number;
    title?: string;
    body: string;
    image_url?: string | null;
  };

  if (!body.product_id) return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  if (!body.author_name?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "author_name and body are required" }, { status: 400 });
  }
  if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }
  if (body.author_name.length > 100) return NextResponse.json({ error: "Name too long" }, { status: 400 });
  if (body.body.length > 2000) return NextResponse.json({ error: "Review too long" }, { status: 400 });
  if (body.title && body.title.length > 200) return NextResponse.json({ error: "Title too long" }, { status: 400 });

  const admin = createAdminClient();

  const [{ data: customer }, { data: deliveredOrders }] = await Promise.all([
    admin.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle(),
    admin.from("orders").select("order_items(product_id)").eq("customer_email", user.email).eq("status", "delivered"),
  ]);

  if (!customer?.id) {
    return NextResponse.json({ error: "You can only review products you've purchased" }, { status: 403 });
  }

  const purchased = (deliveredOrders ?? []).some(order =>
    (order.order_items as { product_id: string | null }[] | null)?.some(item => item.product_id === body.product_id)
  );
  if (!purchased) {
    return NextResponse.json({ error: "You can only review products you've purchased" }, { status: 403 });
  }

  const { data: existingReview } = await admin
    .from("reviews")
    .select("id")
    .eq("product_id", body.product_id)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (existingReview) {
    return NextResponse.json({ error: "You've already reviewed this product" }, { status: 409 });
  }

  const { error } = await admin.from("reviews").insert({
    product_id: body.product_id,
    customer_id: customer.id,
    author_name: body.author_name.trim(),
    rating: body.rating,
    title: body.title?.trim() ?? null,
    body: body.body.trim(),
    image_url: body.image_url ?? null,
    is_verified: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
