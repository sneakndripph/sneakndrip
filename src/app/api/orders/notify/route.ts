import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin-server";
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

  const body = (await req.json()) as OrderConfirmedData & { items: (OrderConfirmedData["items"][number] & { productId?: string })[] };
  const order: OrderConfirmedData = { ...body, items: await withProductImages(body.items) };

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

/** Batch-fetches each item's primary product image in a single query (no N+1). Falls back to no image if the product was deleted or the lookup fails. */
async function withProductImages(
  items: (OrderConfirmedData["items"][number] & { productId?: string })[]
): Promise<OrderConfirmedData["items"]> {
  const productIds = [...new Set(items.map(i => i.productId).filter((id): id is string => Boolean(id)))];
  if (!productIds.length) return items;

  const imageByProductId = new Map<string, string>();
  try {
    const { data } = await createAdminClient()
      .from("products")
      .select("id, images")
      .in("id", productIds);
    for (const row of data ?? []) {
      const image = Array.isArray(row.images) ? row.images[0] : undefined;
      if (image) imageByProductId.set(row.id, image);
    }
  } catch {
    // Best-effort — fall through with placeholders for all items.
  }

  return items.map(({ productId, ...item }) => ({
    ...item,
    imageUrl: productId ? imageByProductId.get(productId) : undefined,
  }));
}
