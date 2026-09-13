import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIP } from "@/lib/rate-limit";

const MAX_ADDRESSES = 5;

async function resolveCustomer(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, customer: null };
  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name, mobile")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  return { user, customer };
}

export async function GET() {
  const supabase = await createClient();
  const { user, customer } = await resolveCustomer(supabase);
  if (!user || !customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { data: addresses } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("customer_id", customer.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  // One-shot backfill: migrate the legacy user_metadata address into
  // shipping_addresses the first time a signed-in user with no saved
  // addresses hits this endpoint. Safe to re-run — only fires while the
  // table is empty for this customer.
  if ((addresses?.length ?? 0) === 0 && user.user_metadata?.addr_street) {
    const { data: created } = await supabase
      .from("shipping_addresses")
      .insert({
        customer_id: customer.id,
        label: "Home",
        full_name: customer.full_name || user.user_metadata?.full_name || "",
        mobile: customer.mobile || user.user_metadata?.mobile || "",
        street: user.user_metadata.addr_street,
        barangay: user.user_metadata?.addr_barangay ?? "",
        city: user.user_metadata?.addr_city ?? "",
        province: user.user_metadata?.addr_province ?? "",
        postal_code: user.user_metadata?.addr_postal ?? "",
        is_default: true,
      })
      .select("*")
      .single();

    return NextResponse.json({ addresses: created ? [created] : [] });
  }

  return NextResponse.json({ addresses: addresses ?? [] });
}

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 20, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = await createClient();
  const { user, customer } = await resolveCustomer(supabase);
  if (!user || !customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

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

  if (!body.full_name?.trim() || !body.mobile?.trim() || !body.street?.trim() ||
      !body.barangay?.trim() || !body.city?.trim() || !body.province?.trim() || !body.postal_code?.trim()) {
    return NextResponse.json({ error: "All address fields are required" }, { status: 400 });
  }

  const { count } = await supabase
    .from("shipping_addresses")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customer.id);

  if ((count ?? 0) >= MAX_ADDRESSES) {
    return NextResponse.json({ error: `You can only save up to ${MAX_ADDRESSES} addresses` }, { status: 400 });
  }

  const makeDefault = body.is_default || count === 0;
  if (makeDefault) {
    await supabase.from("shipping_addresses").update({ is_default: false }).eq("customer_id", customer.id);
  }

  const { data: address, error } = await supabase
    .from("shipping_addresses")
    .insert({
      customer_id: customer.id,
      label: body.label?.trim() || "Home",
      full_name: body.full_name.trim(),
      mobile: body.mobile.trim(),
      street: body.street.trim(),
      barangay: body.barangay.trim(),
      city: body.city.trim(),
      province: body.province.trim(),
      postal_code: body.postal_code.trim(),
      is_default: makeDefault,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ address }, { status: 201 });
}
