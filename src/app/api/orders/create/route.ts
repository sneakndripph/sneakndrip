import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order, items } = body;

    if (!order || !items?.length) {
      return NextResponse.json({ error: "Missing order data" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("orders")
      .insert(order)
      .select("id")
      .single();

    if (error) {
      console.error("Order insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items.map((item: Record<string, unknown>) => ({ ...item, order_id: data.id })));

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      // Rollback order
      await supabase.from("orders").delete().eq("id", data.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
