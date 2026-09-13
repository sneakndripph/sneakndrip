import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIP } from "@/lib/rate-limit";

async function resolveCustomer(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return customer;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = rateLimit(getIP(req), 20, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;
  const supabase = await createClient();
  const customer = await resolveCustomer(supabase);
  if (!customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json() as {
    label?: string;
    full_name?: string;
    mobile?: string;
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    is_default?: boolean;
  };

  const { data: existing } = await supabase
    .from("shipping_addresses")
    .select("id")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  if (body.is_default) {
    await supabase.from("shipping_addresses").update({ is_default: false }).eq("customer_id", customer.id);
  }

  const update: Record<string, string | boolean> = {};
  for (const key of ["label", "full_name", "mobile", "street", "barangay", "city", "province", "postal_code"] as const) {
    const value = body[key];
    if (value !== undefined) update[key] = value.trim();
  }
  if (body.is_default !== undefined) update.is_default = body.is_default;

  const { data: address, error } = await supabase
    .from("shipping_addresses")
    .update(update)
    .eq("id", id)
    .eq("customer_id", customer.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed } = rateLimit(getIP(req), 20, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;
  const supabase = await createClient();
  const customer = await resolveCustomer(supabase);
  if (!customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { data: deleted, error } = await supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", id)
    .eq("customer_id", customer.id)
    .select("is_default")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted) return NextResponse.json({ error: "Address not found" }, { status: 404 });

  // Deleting the default address leaves the rest without one — promote the
  // most recently added remaining address so a default always exists.
  if (deleted.is_default) {
    const { data: remaining } = await supabase
      .from("shipping_addresses")
      .select("id")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (remaining) {
      await supabase.from("shipping_addresses").update({ is_default: true }).eq("id", remaining.id);
    }
  }

  return NextResponse.json({ ok: true });
}
