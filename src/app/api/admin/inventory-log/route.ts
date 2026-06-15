import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";

async function sendRestockEmails(productId: string, productName: string, size: string) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const admin = createAdminClient();
  const { data: notifs } = await admin
    .from("restock_notifications")
    .select("email")
    .eq("product_id", productId)
    .eq("size", size);
  if (!notifs?.length) return;
  for (const n of notifs) {
    if (!n.email) continue;
    await resend.emails.send({
      from: "Sneak N' Drip <orders@sneakndrip.ph>",
      to: n.email,
      subject: `${productName} (${size}) is back in stock!`,
      html: `<div style="max-width:500px;margin:0 auto;font-family:Arial,sans-serif;padding:24px"><h2 style="color:#0D0D0D">Back In Stock!</h2><p style="color:#555;font-size:15px">Good news! <strong>${productName}</strong> in size <strong>${size}</strong> is now available.</p><a href="https://sneakndrip.ph/shop" style="display:inline-block;background:#5BB8B4;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;margin-top:12px">Shop Now</a><p style="color:#aaa;font-size:12px;margin-top:24px">You requested to be notified when this item restocked. Reply to unsubscribe.</p></div>`,
    }).catch(() => {});
  }
  await admin.from("restock_notifications").delete().eq("product_id", productId).eq("size", size);
}

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

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("inventory_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return NextResponse.json(data ?? []);
}

// Manual stock adjustment
export async function POST(req: NextRequest) {
  const user = await getRequestingUser();
  const isAdmin = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { product_id, product_name, size, new_stock, reason } = await req.json();
  if (!product_id || !size || new_stock === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get current stock
  const { data: current } = await admin
    .from("product_sizes")
    .select("stock")
    .eq("product_id", product_id)
    .eq("size", size)
    .single();

  const old_stock = current?.stock ?? 0;

  // Update stock
  const { error } = await admin
    .from("product_sizes")
    .update({ stock: new_stock })
    .eq("product_id", product_id)
    .eq("size", size);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the change
  await admin.from("inventory_log").insert({
    product_id,
    product_name,
    size,
    old_stock,
    new_stock,
    reason: reason || "manual_adjustment",
    changed_by: user.email,
    order_number: null,
  });

  // Send restock notifications if stock went from 0 to >0
  if (old_stock === 0 && new_stock > 0) {
    void sendRestockEmails(product_id, product_name ?? "", size);
  }

  return NextResponse.json({ ok: true, old_stock, new_stock });
}
