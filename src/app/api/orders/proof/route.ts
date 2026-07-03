import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-admin";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const cleanPath = path.replace(/^payment-proofs\//, "");
  const admin = createAdminClient();
  const { data } = await admin.storage
    .from("payment-proofs")
    .createSignedUrl(cleanPath, 3600);

  if (!data?.signedUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ url: data.signedUrl });
}
