import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

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
  const { id, rating, title, body, image_url } = await req.json() as { id?: string; rating?: number; title?: string; body?: string; image_url?: string | null };
  if (!id || !body?.trim()) return NextResponse.json({ error: "Missing id or body" }, { status: 400 });
  if (typeof rating !== "number" || rating < 1 || rating > 5) return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("reviews").update({ rating, title: title?.trim() ?? null, body: body.trim(), image_url: image_url ?? null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    product_id?: string;
    author_name: string;
    rating: number;
    title?: string;
    body: string;
    image_url?: string | null;
  };

  if (!body.author_name?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "author_name and body are required" }, { status: 400 });
  }
  if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("reviews").insert({
    product_id: body.product_id ?? null,
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
