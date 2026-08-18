import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { orderStatusUpdate } from "@/lib/email/templates/orderStatusUpdate";

const FROM_EMAIL = "orders@sneakndrip.ph";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const env = validateEnv();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  const isAdmin = user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { status?: string; tracking_number?: string; admin_notes?: string };

  const admin = createAdminClient();

  // Fetch current order before updating (needed for notifications + inventory)
  const { data: currentOrder } = await admin
    .from("orders")
    .select("status, payment_method, order_number, customer_name, customer_email, tracking_number, order_items(product_id, size, quantity, products(name))")
    .eq("id", id)
    .single();

  const update: Record<string, unknown> = {};
  if (body.status) update.status = body.status;
  if (body.tracking_number !== undefined) update.tracking_number = body.tracking_number;
  if (body.admin_notes !== undefined) update.admin_notes = body.admin_notes;

  // Also sync payment_status when order is accepted/paid or COD delivered
  const isCODOrder = currentOrder?.payment_method === "cod";
  if (body.status === "paid" && !isCODOrder) update.payment_status = "paid";
  if (body.status === "delivered" && isCODOrder) update.payment_status = "paid";

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await admin.from("orders").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Restore stock + log inventory when admin cancels an active order
  const RESTOCKABLE = ["pending", "paid", "processing"];
  if (body.status === "cancelled" && currentOrder && RESTOCKABLE.includes(currentOrder.status)) {
    for (const item of (currentOrder.order_items as { product_id: string; size: string; quantity: number; products: { name: string }[] | null }[])) {
      if (!item.product_id) continue;
      const { data: row } = await admin.from("product_sizes").select("stock").eq("product_id", item.product_id).eq("size", item.size).single();
      if (row) {
        const newStock = row.stock + item.quantity;
        await admin.from("product_sizes").update({ stock: newStock }).eq("product_id", item.product_id).eq("size", item.size);
        void admin.from("inventory_log").insert({
          product_id: item.product_id,
          product_name: item.products?.[0]?.name ?? "Unknown",
          size: item.size,
          old_stock: row.stock,
          new_stock: newStock,
          reason: "order_cancelled",
          changed_by: user.email ?? "admin",
          order_number: currentOrder.order_number,
        });
      }
    }
  }

  // Log the activity
  if (body.status && currentOrder) {
    void admin.from("activity_log").insert({
      action: "status_updated",
      entity_type: "order",
      entity_id: id,
      entity_name: currentOrder.order_number,
      actor_email: user.email ?? null,
      details: { from: currentOrder.status, to: body.status, ...(body.tracking_number ? { tracking: body.tracking_number } : {}) },
    });
  }

  // ── Status change notification email ────────────────────────────────────
  if (body.status && currentOrder?.customer_email) {
    const trackingNum = body.tracking_number ?? currentOrder.tracking_number ?? null;
    const emailContent = orderStatusUpdate(body.status, {
      orderNumber: currentOrder.order_number,
      customerName: currentOrder.customer_name,
      trackingNumber: trackingNum,
      isCOD: isCODOrder,
    });
    if (emailContent) {
      void sendEmail(currentOrder.customer_email, emailContent.subject, emailContent.html, {
        from: `Sneak N' Drip <${FROM_EMAIL}>`,
      });
    }
  }

  // ── Insert in-app notification for stock_on_hand ────────────────────────
  if (body.status === "stock_on_hand" && currentOrder?.customer_email) {
    void admin.from("notifications").insert({
      user_email: currentOrder.customer_email,
      title: "Your pre-order has arrived in the Philippines!",
      message: `Order ${currentOrder.order_number} is here. Please settle your balance so we can ship it to you.`,
      order_number: currentOrder.order_number,
      type: "order",
    });
  }

  // ── Tracking number added/updated on shipped order → notify customer ──
  if (!body.status && body.tracking_number && currentOrder?.status === "shipped" && currentOrder.customer_email) {
    const emailContent = orderStatusUpdate("shipped", {
      orderNumber: currentOrder.order_number,
      customerName: currentOrder.customer_name,
      trackingNumber: body.tracking_number,
      isCOD: isCODOrder,
    });
    if (emailContent) {
      void sendEmail(
        currentOrder.customer_email,
        `Tracking Number Updated — ${currentOrder.order_number} | Sneak N' Drip`,
        emailContent.html,
        { from: `Sneak N' Drip <${FROM_EMAIL}>` },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  const isAdmin = user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
