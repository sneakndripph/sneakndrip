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
  return NextResponse.redirect(data.signedUrl);
}
