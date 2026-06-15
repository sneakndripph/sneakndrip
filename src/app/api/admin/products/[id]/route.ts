import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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

async function sendRestockEmails(productId: string, restockedSizes: string[], productName: string) {
  if (!process.env.RESEND_API_KEY || restockedSizes.length === 0) return;
  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  for (const size of restockedSizes) {
    const { data: notifs } = await admin
      .from("restock_notifications")
      .select("email")
      .eq("product_id", productId)
      .eq("size", size);

    if (!notifs?.length) continue;

    const emails = notifs.map(n => n.email).filter(Boolean);
    for (const email of emails) {
      await resend.emails.send({
        from: `Sneak N' Drip <${FROM_EMAIL}>`,
        to: email,
        subject: `${productName} (${size}) is back in stock!`,
        html: `
          <div style="max-width:500px;margin:0 auto;font-family:Arial,sans-serif;padding:24px">
            <h2 style="color:#0D0D0D">Back In Stock!</h2>
            <p style="color:#555;font-size:15px">Good news! <strong>${productName}</strong> in size <strong>${size}</strong> is now available.</p>
            <a href="https://sneakndrip.ph/shop" style="display:inline-block;background:#5BB8B4;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;margin-top:12px">Shop Now</a>
            <p style="color:#aaa;font-size:12px;margin-top:24px">You requested to be notified when this item restocked. Reply to unsubscribe.</p>
          </div>`,
      }).catch(() => {});
    }

    await admin.from("restock_notifications").delete()
      .eq("product_id", productId).eq("size", size);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  const isAdmin = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const productRaw = formData.get("product") as string | null;
  const sizesRaw = formData.get("sizes") as string | null;
  if (!productRaw) return NextResponse.json({ error: "Missing product data" }, { status: 400 });

  let parsedProduct: Record<string, unknown>;
  let sizes: { size: string; stock: number }[];
  try {
    parsedProduct = JSON.parse(productRaw) as Record<string, unknown>;
    sizes = JSON.parse(sizesRaw ?? "[]") as { size: string; stock: number }[];
  } catch {
    return NextResponse.json({ error: "Invalid JSON in form data" }, { status: 400 });
  }

  const { id: _id, created_at, updated_at, product_sizes, ...product } = parsedProduct;

  // Read current sizes to detect restocks
  const { data: oldSizes } = await admin.from("product_sizes").select("size, stock").eq("product_id", id);
  const oldStockMap = new Map((oldSizes ?? []).map(s => [s.size, s.stock]));

  // Images are already uploaded client-side; product.images contains the final URL array
  const { error } = await admin.from("products").update(product).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("product_sizes").delete().eq("product_id", id);
  if (sizes.length > 0) {
    await admin.from("product_sizes").insert(
      sizes.map(s => ({ product_id: id, size: s.size, stock: s.stock }))
    );
  }

  // Send restock emails for sizes that went from 0 to > 0
  const restockedSizes = sizes
    .filter(s => s.stock > 0 && (oldStockMap.get(s.size) ?? 0) === 0)
    .map(s => s.size);
  const productName = (product as { name?: string }).name ?? "Product";
  sendRestockEmails(id, restockedSizes, productName).catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  const isAdminDel = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
  if (!user || !isAdminDel) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
