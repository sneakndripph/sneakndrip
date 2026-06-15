import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { cookies } from "next/headers";

async function getUser() {
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
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("return_requests")
    .select("*")
    .eq("customer_email", user.email)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ returns: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { order_id, order_number, reason, photo_url } = await req.json();
    if (!order_id || !order_number || !reason?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify the order belongs to this customer
    const { data: order } = await admin
      .from("orders")
      .select("id, status, customer_email, customer_name")
      .eq("order_number", order_number)
      .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.customer_email !== user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (order.status !== "delivered") return NextResponse.json({ error: "Only delivered orders can be returned" }, { status: 400 });

    // Check for duplicate
    const { data: existing } = await admin
      .from("return_requests")
      .select("id")
      .eq("order_number", order_number)
      .maybeSingle();

    if (existing) return NextResponse.json({ error: "A return request already exists for this order" }, { status: 409 });

    const { data, error } = await admin.from("return_requests").insert({
      order_id,
      order_number,
      customer_email: user.email,
      customer_name: order.customer_name ?? user.user_metadata?.full_name ?? user.email,
      reason: reason.trim(),
      photo_url: photo_url ?? null,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ return_request: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
