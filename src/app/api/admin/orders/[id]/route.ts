import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { sendEmail } from "@/lib/email/send";
import { applyStatusChange, STATUS_CHANGE_ORDER_SELECT, type StatusChangeOrder } from "@/lib/orders/apply-status-change";
import { orderStatusUpdate } from "@/lib/email/templates/orderStatusUpdate";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";
import { orderStatusSchema } from "@/lib/validation/schemas";

const FROM_EMAIL = "orders@sneakndrip.ph";

const orderUpdateSchema = z.object({
  status: orderStatusSchema.optional(),
  tracking_number: z.string().optional(),
  admin_notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await validateBody(req, orderUpdateSchema);
  if ("error" in result) return result.error;
  const body = result.data;

  const admin = createAdminClient();

  // Fetch current order before updating (needed for notifications + inventory)
  const { data: currentOrder } = await admin
    .from("orders")
    .select(STATUS_CHANGE_ORDER_SELECT)
    .eq("id", id)
    .single<StatusChangeOrder>();

  const extraUpdate: Record<string, unknown> = {};
  if (body.tracking_number !== undefined) extraUpdate.tracking_number = body.tracking_number;
  if (body.admin_notes !== undefined) extraUpdate.admin_notes = body.admin_notes;

  // Status changes (and their side effects) go through the shared helper
  if (body.status) {
    if (!currentOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const change = await applyStatusChange(admin, currentOrder, body.status, user.email ?? null, {
      extraUpdate,
      trackingNumber: body.tracking_number,
    });
    if (!change.updated) {
      return change.skipped === "not_found"
        ? NextResponse.json({ error: "Order not found" }, { status: 404 })
        : NextResponse.json({ error: change.error ?? "Failed to update order" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (Object.keys(extraUpdate).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await admin.from("orders").update(extraUpdate).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const isCODOrder = currentOrder?.payment_method === "cod";

  // ── Tracking number added/updated on shipped order → notify customer ──
  if (body.tracking_number && currentOrder?.status === "shipped" && currentOrder.customer_email) {
    const emailContent = orderStatusUpdate("shipped", {
      orderNumber: currentOrder.order_number,
      customerName: currentOrder.customer_name ?? "",
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
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
