import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "No path" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("payment-proofs")
    .createSignedUrl(path, 300);

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Proxy bytes directly — avoids redirect/CORS issues with <img> tags
  try {
    const imgRes = await fetch(data.signedUrl);
    if (!imgRes.ok) return NextResponse.redirect(data.signedUrl);
    const buffer = await imgRes.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": imgRes.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=300, no-transform",
      },
    });
  } catch {
    return NextResponse.redirect(data.signedUrl);
  }
}
