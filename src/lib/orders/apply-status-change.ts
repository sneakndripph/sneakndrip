import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { orderStatusUpdate } from "@/lib/email/templates/orderStatusUpdate";

const FROM_EMAIL = "orders@sneakndrip.ph";

// Statuses whose stock is still held, so cancelling them returns it to inventory.
const RESTOCKABLE = ["pending", "paid", "processing"];

/** Columns applyStatusChange needs — select these when loading the order(s). */
export const STATUS_CHANGE_ORDER_SELECT =
  "id, status, payment_method, order_number, customer_name, customer_email, tracking_number, order_items(product_id, size, quantity, products(name))";

type ItemProduct = { name: string } | { name: string }[] | null;

export type StatusChangeOrder = {
  id: string;
  status: string;
  payment_method: string | null;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  tracking_number: string | null;
  order_items: { product_id: string | null; size: string; quantity: number; products: ItemProduct }[] | null;
};

export type StatusChangeResult =
  | { updated: true; patch: Record<string, unknown> }
  | { updated: false; skipped: "not_found" | "update_failed"; error?: string };

function productName(p: ItemProduct) {
  return (Array.isArray(p) ? p[0]?.name : p?.name) ?? "Unknown";
}

/**
 * Moves one order to `toStatus` and runs every side effect of that transition:
 * payment_status sync, delivered_at stamp, stock restore on cancel, activity_log
 * (feeds the order timeline), customer status email and the stock_on_hand
 * in-app notification. Shared by PATCH /api/admin/orders/[id] and /bulk.
 *
 * `extraUpdate` is written in the same UPDATE (e.g. tracking_number, admin_notes).
 */
export async function applyStatusChange(
  admin: SupabaseClient,
  order: StatusChangeOrder,
  toStatus: string,
  actorEmail: string | null,
  options: { extraUpdate?: Record<string, unknown>; trackingNumber?: string } = {},
): Promise<StatusChangeResult> {
  const isCOD = order.payment_method === "cod";
  const update: Record<string, unknown> = { ...options.extraUpdate, status: toStatus };

  // Sync payment_status when a prepaid order is accepted or a COD order is delivered
  if (toStatus === "paid" && !isCOD) update.payment_status = "paid";
  if (toStatus === "delivered" && isCOD) update.payment_status = "paid";

  // Stamp delivered_at only on the transition into "delivered" — never cleared
  // on a later status change, so it stays a record of when delivery happened.
  if (toStatus === "delivered" && order.status !== "delivered") {
    update.delivered_at = new Date().toISOString();
  }

  const { data: updatedRows, error } = await admin.from("orders").update(update).eq("id", order.id).select("id");
  if (error) return { updated: false, skipped: "update_failed", error: error.message };
  if (!updatedRows?.length) return { updated: false, skipped: "not_found" };

  // Restore stock + log inventory when an active order is cancelled
  if (toStatus === "cancelled" && RESTOCKABLE.includes(order.status)) {
    for (const item of order.order_items ?? []) {
      if (!item.product_id) continue;
      const { data: row } = await admin.from("product_sizes").select("stock").eq("product_id", item.product_id).eq("size", item.size).single();
      if (row) {
        const newStock = row.stock + item.quantity;
        await admin.from("product_sizes").update({ stock: newStock }).eq("product_id", item.product_id).eq("size", item.size);
        // Awaited: Supabase builders only send on await/then, so `void` never ran.
        const { error: invError } = await admin.from("inventory_log").insert({
          product_id: item.product_id,
          product_name: productName(item.products),
          size: item.size,
          old_stock: row.stock,
          new_stock: newStock,
          reason: "order_cancelled",
          changed_by: actorEmail ?? "admin",
          order_number: order.order_number,
        });
        if (invError) console.error("[inventory_log] insert failed:", invError);
      }
    }
  }

  try {
    const { error: logError } = await admin.from("activity_log").insert({
      action: "status_updated",
      entity_type: "order",
      entity_id: order.id,
      entity_name: order.order_number,
      actor_email: actorEmail,
      details: { from: order.status, to: toStatus, ...(options.trackingNumber ? { tracking: options.trackingNumber } : {}) },
    });
    if (logError) console.error("[activity_log] insert failed:", logError);
  } catch (err) {
    console.error("[activity_log] insert failed:", err);
  }

  // ── Status change notification email ────────────────────────────────────
  if (order.customer_email) {
    const emailContent = orderStatusUpdate(toStatus, {
      orderNumber: order.order_number,
      customerName: order.customer_name ?? "",
      trackingNumber: options.trackingNumber ?? order.tracking_number ?? null,
      isCOD,
    });
    if (emailContent) {
      void sendEmail(order.customer_email, emailContent.subject, emailContent.html, {
        from: `Sneak N' Drip <${FROM_EMAIL}>`,
      });
    }
  }

  // ── In-app notification for stock_on_hand ───────────────────────────────
  if (toStatus === "stock_on_hand" && order.customer_email) {
    const { error: notifError } = await admin.from("notifications").insert({
      user_email: order.customer_email,
      title: "Your pre-order has arrived in the Philippines!",
      message: `Order ${order.order_number} is here. Please settle your balance so we can ship it to you.`,
      order_number: order.order_number,
      type: "order",
    });
    if (notifError) console.error("[notifications] insert failed:", notifError);
  }

  return { updated: true, patch: update };
}
