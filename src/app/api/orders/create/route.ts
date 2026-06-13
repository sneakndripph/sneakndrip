import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

type StockItem = { product_id: string; size: string; quantity: number };

async function refundStock(supabase: ReturnType<typeof createAdminClient>, items: StockItem[]) {
  for (const item of items) {
    const { data: row } = await supabase
      .from("product_sizes")
      .select("stock")
      .eq("product_id", item.product_id)
      .eq("size", item.size)
      .single();
    if (row) {
      await supabase
        .from("product_sizes")
        .update({ stock: row.stock + item.quantity })
        .eq("product_id", item.product_id)
        .eq("size", item.size);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order, items } = body;

    if (!order || !items?.length) {
      return NextResponse.json({ error: "Missing order data" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Atomically check + deduct stock for all items in one DB transaction.
    const stockItems: StockItem[] = items
      .filter((i: Record<string, unknown>) => i.product_id)
      .map((i: Record<string, unknown>) => ({
        product_id: i.product_id as string,
        size: i.size as string,
        quantity: i.quantity as number,
      }));

    if (stockItems.length > 0) {
      const { data: stockResult, error: stockError } = await supabase.rpc(
        "decrement_stock_for_order",
        { p_items: stockItems }
      );
      if (stockError) {
        console.error("Stock deduction error:", stockError);
        return NextResponse.json({ error: "Failed to reserve stock" }, { status: 500 });
      }
      if (stockResult !== "ok") {
        const size = String(stockResult).split(":")[1] ?? "this size";
        return NextResponse.json(
          { error: `Sorry, size ${size} just sold out. Please remove it from your cart.`, outOfStock: true },
          { status: 409 }
        );
      }
    }

    // Insert order
    const { data, error } = await supabase
      .from("orders")
      .insert(order)
      .select("id")
      .single();

    if (error) {
      console.error("Order insert error:", error);
      if (stockItems.length > 0) await refundStock(supabase, stockItems);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(items.map((item: Record<string, unknown>) => ({ ...item, order_id: data.id })));

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      await supabase.from("orders").delete().eq("id", data.id);
      if (stockItems.length > 0) await refundStock(supabase, stockItems);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Fire-and-forget: log stock changes to inventory_log
    if (stockItems.length > 0) {
      Promise.all(
        stockItems.map(async (item) => {
          const { data: sizeRow } = await supabase
            .from("product_sizes")
            .select("stock")
            .eq("product_id", item.product_id)
            .eq("size", item.size)
            .single();
          const matchedItem = (items as Record<string, unknown>[]).find(
            i => i.product_id === item.product_id && i.size === item.size
          );
          const newStock = sizeRow?.stock ?? 0;
          return {
            product_id: item.product_id,
            product_name: String(matchedItem?.product_name ?? ""),
            size: item.size,
            old_stock: newStock + item.quantity,
            new_stock: newStock,
            reason: "order_placed",
            changed_by: String((order as Record<string, unknown>).customer_email ?? ""),
            order_number: String((order as Record<string, unknown>).order_number ?? ""),
          };
        })
      ).then(entries => supabase.from("inventory_log").insert(entries)).catch(() => {});
    }

    // Increment coupon uses
    const couponCode = (order as Record<string, unknown>).coupon_code as string | undefined;
    if (couponCode) {
      try {
        const { data: c } = await supabase.from("coupons").select("id, uses").eq("code", couponCode).single();
        if (c) await supabase.from("coupons").update({ uses: c.uses + 1 }).eq("id", c.id);
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
