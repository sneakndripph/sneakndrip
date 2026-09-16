import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { validateEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { newArrival } from "@/lib/email/templates/newArrival";
import { z } from "zod";
import { productCreateSchema, productSizeSchema } from "@/lib/validation/schemas";

export async function GET() {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id, name, brand, status, images, cost_price, full_payment_price, sale_price, sale_start, sale_end, is_published, product_sizes(size, stock)")
    .order("name");
  const products = (data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    status: p.status,
    images: p.images ?? null,
    cost_price: p.cost_price ?? null,
    full_payment_price: p.full_payment_price,
    sale_price: p.sale_price ?? null,
    sale_start: p.sale_start ?? null,
    sale_end: p.sale_end ?? null,
    is_published: p.is_published,
    sizes: (Array.isArray(p.product_sizes) ? p.product_sizes : [])
      .sort((a: { size: string }, b: { size: string }) => parseFloat(a.size.replace("US ", "")) - parseFloat(b.size.replace("US ", ""))),
  }));
  return NextResponse.json(products);
}

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

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestingUser();
    const isAdmin = user?.app_metadata?.role === "admin";
    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const formData = await req.formData();

    const productRaw = formData.get("product") as string | null;
    const sizesRaw = formData.get("sizes") as string | null;
    const notifySubscribers = formData.get("notifySubscribers") === "true";

    let parsedProduct: unknown;
    let parsedSizes: unknown;
    try {
      parsedProduct = JSON.parse(productRaw ?? "");
      parsedSizes = JSON.parse(sizesRaw ?? "[]");
    } catch {
      return NextResponse.json({ error: "Invalid JSON in form data" }, { status: 400 });
    }

    const productResult = productCreateSchema.safeParse(parsedProduct);
    if (!productResult.success) {
      return NextResponse.json({ error: productResult.error.issues[0]?.message ?? "Invalid product data" }, { status: 400 });
    }
    const sizesResult = z.array(productSizeSchema).safeParse(parsedSizes);
    if (!sizesResult.success) {
      return NextResponse.json({ error: sizesResult.error.issues[0]?.message ?? "Invalid sizes data" }, { status: 400 });
    }
    const product = productResult.data;
    const sizes = sizesResult.data;

    // Images are already uploaded client-side; URLs are in product.images
    const { data, error } = await admin.from("products").insert(product).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (sizes.length > 0) {
      await admin.from("product_sizes").insert(
        sizes.map(s => ({ product_id: data.id, size: s.size, stock: s.stock }))
      );
    }

    try {
      const { error: logError } = await admin.from("activity_log").insert({
        action: "product_created",
        entity_type: "product",
        entity_id: data.id,
        entity_name: product.name,
        actor_email: user.email ?? null,
        details: null,
      });
      if (logError) console.error("[activity_log] insert failed:", logError);
    } catch (err) {
      console.error("[activity_log] insert failed:", err);
    }

    if (product.is_published === true && notifySubscribers) {
      try {
        const { data: subscribers } = await admin
          .from("newsletter_subscribers")
          .select("email, unsubscribe_token")
          .is("unsubscribed_at", null);

        let sentCount = 0;
        for (const subscriber of subscribers ?? []) {
          const { subject, html } = newArrival({
            customerEmail: subscriber.email,
            unsubscribeToken: subscriber.unsubscribe_token,
            product: {
              name: product.name,
              brand: product.brand,
              slug: product.slug,
              imageUrl: product.images?.[0],
              price: product.full_payment_price,
            },
          });
          const result = await sendEmail(subscriber.email, subject, html);
          if (result.ok && !result.skipped) sentCount++;
        }

        const { error: notifyLogError } = await admin.from("activity_log").insert({
          action: "new_arrival_notified",
          entity_type: "product",
          entity_id: data.id,
          entity_name: product.name,
          actor_email: user.email ?? null,
          details: { product_id: data.id, subscriber_count: sentCount },
        });
        if (notifyLogError) console.error("[activity_log] new_arrival_notified insert failed:", notifyLogError);
      } catch (err) {
        console.error("[new-arrival-notify] failed:", err);
      }
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
