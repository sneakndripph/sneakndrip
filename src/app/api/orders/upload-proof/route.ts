import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const orderNumber = formData.get("orderNumber") as string | null;
  const type = formData.get("type") as string | null;

  if (!file || !orderNumber) {
    return NextResponse.json({ error: "Missing file or orderNumber" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const suffix = type === "balance_proof" ? "_balance" : "";
  const path = `${orderNumber}${suffix}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("payment-proofs")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path: data.path });
}
