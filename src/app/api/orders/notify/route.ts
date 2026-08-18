import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-admin";
import { sendEmail } from "@/lib/email/send";
import { orderConfirmedCustomer, orderConfirmedAdmin, type OrderConfirmedData } from "@/lib/email/templates/orderConfirmed";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "donjulio263@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: "no api key" });
  }

  const caller = await requireUser();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = (await req.json()) as OrderConfirmedData;

  const customerEmail = orderConfirmedCustomer(order);
  const adminEmail = orderConfirmedAdmin(order);

  const [customerResult, adminResult] = await Promise.all([
    sendEmail(order.customer.email, customerEmail.subject, customerEmail.html, {
      from: `Sneak N' Drip <${FROM_EMAIL}>`,
    }),
    sendEmail(ADMIN_EMAIL, adminEmail.subject, adminEmail.html, {
      from: `Sneak N' Drip Orders <${FROM_EMAIL}>`,
    }),
  ]);

  if (!customerResult.ok || !adminResult.ok) {
    const error = !customerResult.ok ? customerResult.error : !adminResult.ok ? adminResult.error : "unknown";
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
