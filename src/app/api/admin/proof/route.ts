import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");

  if (!path && !orderNumber) {
    return NextResponse.json({ error: "No path or orderNumber" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (path) {
    const cleanPath = path.replace(/^payment-proofs\//, "");
    const { data, error } = await admin.storage.from("payment-proofs").createSignedUrl(cleanPath, 300);
    if (error || !data?.signedUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.redirect(data.signedUrl);
  }

  const { data: files } = await admin.storage.from("payment-proofs").list("", { search: orderNumber! });
  const match = files?.find(f => f.name.startsWith(orderNumber!));
  if (!match) return NextResponse.json({ error: "No proof found" }, { status: 404 });

  const { data, error } = await admin.storage.from("payment-proofs").createSignedUrl(match.name, 300);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
