import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

async function proxySignedUrl(signedUrl: string): Promise<NextResponse> {
  try {
    const imgRes = await fetch(signedUrl);
    if (!imgRes.ok) return NextResponse.redirect(signedUrl);
    const buffer = await imgRes.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": imgRes.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=300, no-transform",
      },
    });
  } catch {
    return NextResponse.redirect(signedUrl);
  }
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");

  if (!path && !orderNumber) {
    return NextResponse.json({ error: "No path or orderNumber" }, { status: 400 });
  }

  const admin = createAdminClient();

  // If we have a direct path saved in the DB, use it
  if (path) {
    const { data, error } = await admin.storage
      .from("payment-proofs")
      .createSignedUrl(path, 300);
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return proxySignedUrl(data.signedUrl);
  }

  // Fallback: search bucket for any file starting with the order number
  const { data: files } = await admin.storage
    .from("payment-proofs")
    .list("", { search: orderNumber! });

  const match = files?.find(f => f.name.startsWith(orderNumber!));
  if (!match) return NextResponse.json({ error: "No proof found" }, { status: 404 });

  const { data, error } = await admin.storage
    .from("payment-proofs")
    .createSignedUrl(match.name, 300);

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return proxySignedUrl(data.signedUrl);
}
