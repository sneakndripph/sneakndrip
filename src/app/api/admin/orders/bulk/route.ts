import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { sendEmail } from "@/lib/email/send";
import { orderStatusUpdate } from "@/lib/email/templates/orderStatusUpdate";

const FROM_EMAIL = "orders@sneakndrip.ph";

export async function PATCH(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, status } = await req.json();
  if (!ids?.length || !status)
    return NextResponse.json({ error: "Missing ids or status" }, { status: 400 });

  const admin = createAdminClient();

  const { data: targetOrders } = await admin
    .from("orders")
    .select("id, order_number, customer_name, customer_email, payment_method, tracking_number")
    .in("id", ids);

  const { error } = await admin
    .from("orders")
    .update({ status })
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
