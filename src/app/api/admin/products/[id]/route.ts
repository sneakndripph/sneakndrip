import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { restockAlert } from "@/lib/email/templates/restockAlert";

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

async function sendRestockEmails(productId: string, restockedSizes: string[], productName: string, productSlug: string) {
  if (restockedSizes.length === 0) return;
  const admin = createAdminClient();

  for (const size of restockedSizes) {
    const { data: notifs } = await admin
      .from("restock_notifications")
      .select("email")
      .eq("product_id", productId)
      .eq("size", size);

    if (!notifs?.length) continue;

    const emails = notifs.map(n => n.email).filter(Boolean);
    const { subject, html } = restockAlert({ productName, productSlug, size });

    const results = await Promise.allSettled(
      emails.map(email => sendEmail(email, subject, html)),
    );

    const successfulEmails: string[] = [];
    const failedEmails: string[] = [];
    results.forEach((result, i) => {
      const ok = result.status === "fulfilled" && result.value.ok && !result.value.skipped;
      (ok ? successfulEmails : failedEmails).push(emails[i]);
    });

    console.log(`Restock emails for ${productName} (${size}): ${successfulEmails.length} sent, ${failedEmails.length} failed`);

    if (successfulEmails.length > 0) {
      await admin.from("restock_notifications").delete()
        .eq("product_id", productId).eq("size", size)
        .in("email", successfulEmails);
    }
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  const isAdmin = user?.app_metadata?.role === "admin";
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

  if (sizes.length > 0) {
    await admin.from("product_sizes").delete().eq("product_id", id);
    await admin.from("product_sizes").insert(
      sizes.map(s => ({ product_id: id, size: s.size, stock: s.stock }))
    );
  }

  const productName = (product as { name?: string }).name ?? "Product";
  const productSlug = (product as { slug?: string }).slug ?? id;
  if (sizes.length > 0) {
    const restockedSizes = sizes
      .filter(s => s.stock > 0 && (oldStockMap.get(s.size) ?? 0) === 0)
      .map(s => s.size);
    await sendRestockEmails(id, restockedSizes, productName, productSlug);
  }

  void admin.from("activity_log").insert({
    action: "product_updated",
    entity_type: "product",
    entity_id: id,
    entity_name: productName,
    actor_email: user.email ?? null,
    details: null,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  const isAdminDel = user?.app_metadata?.role === "admin";
  if (!user || !isAdminDel) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
