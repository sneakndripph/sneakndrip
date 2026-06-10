import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    product_id?: string;
    author_name: string;
    rating: number;
    title?: string;
    body: string;
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
    is_verified: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
