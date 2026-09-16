import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { sendEmail } from "@/lib/email/send";
import { orderStatusUpdate } from "@/lib/email/templates/orderStatusUpdate";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";
import { orderStatusSchema, uuidSchema } from "@/lib/validation/schemas";

const FROM_EMAIL = "orders@sneakndrip.ph";

const orderBulkUpdateSchema = z.object({
  ids: z.array(uuidSchema).min(1, "Missing ids or status"),
  status: orderStatusSchema,
});

export async function PATCH(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await validateBody(req, orderBulkUpdateSchema);
  if ("error" in result) return result.error;
  const { ids, status } = result.data;

  const admin = createAdminClient();

  const { data: targetOrders } = await admin
    .from("orders")
    .select("id, order_number, customer_name, customer_email, payment_method, tracking_number, status")
    .in("id", ids);

  if (status === "delivered") {
    const newlyDeliveredIds = (targetOrders ?? []).filter(o => o.status !== "delivered").map(o => o.id);
    const alreadyDeliveredIds = (targetOrders ?? []).filter(o => o.status === "delivered").map(o => o.id);

    if (newlyDeliveredIds.length) {
      const { error } = await admin
        .from("orders")
        .update({ status, delivered_at: new Date().toISOString() })
        .in("id", newlyDeliveredIds);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (alreadyDeliveredIds.length) {
      const { error } = await admin.from("orders").update({ status }).in("id", alreadyDeliveredIds);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await admin.from("orders").update({ status }).in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (targetOrders?.length) {
    void (async () => {
      const results = await Promise.allSettled(
        targetOrders
          .filter(order => order.customer_email)
          .map(order => {
            const emailContent = orderStatusUpdate(status, {
              orderNumber: order.order_number,
              customerName: order.customer_name,
              trackingNumber: order.tracking_number ?? null,
              isCOD: order.payment_method === "cod",
            });
            if (!emailContent) return Promise.resolve({ ok: true, skipped: true } as const);
            return sendEmail(order.customer_email, emailContent.subject, emailContent.html, {
              from: `Sneak N' Drip <${FROM_EMAIL}>`,
            });
          }),
      );

      const sent = results.filter(r => r.status === "fulfilled" && r.value.ok && !r.value.skipped).length;
      const failed = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)).length;
      console.log(`Bulk status update: ${ids.length} orders updated, ${sent} emails sent, ${failed} email failures`);
    })();
  }

  return NextResponse.json({ ok: true, updated: ids.length });
}
