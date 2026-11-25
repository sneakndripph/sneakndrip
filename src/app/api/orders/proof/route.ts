import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-admin";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { proofKeyOrderNumber } from "@/lib/orders/proof-key";

export async function GET(req: NextRequest) {
  const { allowed } = await rateLimit(`orders-proof:${getIP(req)}`, 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const user = await requireUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  // Only sign a well-formed proof key whose order belongs to the caller.
  const cleanPath = path.replace(/^payment-proofs\//, "");
  const orderNumber = proofKeyOrderNumber(cleanPath);
  if (!orderNumber) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .eq("customer_email", user.email)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await admin.storage.from("payment-proofs").createSignedUrl(cleanPath, 3600);
  if (!data?.signedUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ url: data.signedUrl });
}
