import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  if (!orderNumber) return NextResponse.json({ error: "Missing orderNumber" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();

  // Verify user owns this order
  const { data: order } = await admin
    .from("orders")
    .select("proof_of_payment, order_number")
    .eq("order_number", orderNumber)
    .eq("customer_email", user.email)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const proofPath = order.proof_of_payment as string | null;

  if (proofPath) {
    const cleanPath = proofPath.replace(/^payment-proofs\//, "");
    const { data, error } = await admin.storage.from("payment-proofs").createSignedUrl(cleanPath, 300);
    if (!error && data?.signedUrl) return NextResponse.redirect(data.signedUrl);
  }

  // Fallback: search by order number prefix in bucket root
  const { data: files } = await admin.storage.from("payment-proofs").list("", { search: orderNumber });
  const match = files?.find(f => f.name.startsWith(orderNumber));
  if (!match) return NextResponse.json({ error: "No proof found" }, { status: 404 });

  const { data, error } = await admin.storage.from("payment-proofs").createSignedUrl(match.name, 300);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.redirect(data.signedUrl);
}
