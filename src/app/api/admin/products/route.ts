import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { sendNewArrivalBroadcast } from "@/lib/email/new-arrival";
import { z } from "zod";
import { productCreateSchema, productSizeSchema } from "@/lib/validation/schemas";

export async function GET() {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id, name, brand, status, images, cost_price, full_payment_price, sale_price, sale_start, sale_end, is_published, created_at, product_sizes(size, stock)")
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
    created_at: p.created_at,
    sizes: (Array.isArray(p.product_sizes) ? p.product_sizes : [])
      .sort((a: { size: string }, b: { size: string }) => parseFloat(a.size.replace("US ", "")) - parseFloat(b.size.replace("US ", ""))),
  }));
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) {
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
        await sendNewArrivalBroadcast(data.id, user.email ?? null);
      } catch (err) {
        console.error("[new-arrival-notify] failed:", err);
      }
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
