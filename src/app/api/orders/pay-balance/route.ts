import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = "donjulio263@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const BRAND_TEAL = "#5BB8B4";
const BRAND_BLACK = "#0D0D0D";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = await getRequestingUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    orderNumber: string;
    balance: number;
    paymentMethod: string;
    reference: string;
    proofPath: string;
  };

  if (!body.orderNumber || !body.reference) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, customer_name, customer_email, status")
    .eq("order_number", body.orderNumber)
    .eq("customer_email", user.email)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "stock_on_hand") {
    return NextResponse.json({ error: "Order is not awaiting balance payment" }, { status: 400 });
  }

  await admin.from("orders").update({
    balance_reference: body.reference,
    balance_proof_url: body.proofPath || null,
    balance_paid_at: new Date().toISOString(),
    balance_payment_method: body.paymentMethod || null,
  }).eq("id", order.id);

  void admin.from("activity_log").insert({
    action: "balance_payment_submitted",
    entity_type: "order",
    entity_id: order.id,
    entity_name: order.order_number,
    actor_email: user.email,
    details: { reference: body.reference, payment_method: body.paymentMethod, balance: body.balance },
  });

  void admin.from("notifications").insert({
    user_email: user.email,
    title: "Balance payment received!",
    message: `We've received your balance payment for order ${body.orderNumber}. We'll verify and process your shipment shortly.`,
    order_number: body.orderNumber,
    type: "order",
  });

  const PAYMENT_LABELS: Record<string, string> = {
    gcash: "GCash", maya: "Maya", bank_transfer: "Bank Transfer",
  };

  if (resend) {
    resend.emails.send({
      from: `Sneak N' Drip <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `💳 Balance Payment Submitted — ${body.orderNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;padding:20px">
          <h2 style="color:${BRAND_BLACK}">Balance Payment Submitted</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#888;width:120px">Order</td><td style="font-weight:bold;color:${BRAND_TEAL}">${body.orderNumber}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Customer</td><td>${order.customer_name} (${order.customer_email})</td></tr>
            <tr><td style="padding:8px 0;color:#888">Method</td><td>${PAYMENT_LABELS[body.paymentMethod] ?? body.paymentMethod}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Reference</td><td style="font-weight:bold">${body.reference}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Balance</td><td style="font-weight:bold;color:${BRAND_TEAL}">₱${Number(body.balance).toLocaleString()}</td></tr>
          </table>
          <p style="font-size:13px;color:#888;margin-top:16px">Please review the balance payment and mark as Processing once verified.</p>
        </div>`,
    }).catch(err => console.error("Balance email error:", err));
  }

  return NextResponse.json({ ok: true });
}
