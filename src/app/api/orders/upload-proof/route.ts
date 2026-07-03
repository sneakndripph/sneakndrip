import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-admin";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "pdf", "heic", "heif"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const orderNumber = formData.get("orderNumber") as string | null;
  const type = formData.get("type") as string | null;

  if (!file || !orderNumber) {
    return NextResponse.json({ error: "Missing file or orderNumber" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure the order belongs to this authenticated user
  const { data: order } = await admin
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .eq("customer_email", user.email!)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const suffix = type === "balance_proof" ? "_balance" : "";
  const path = `${orderNumber}${suffix}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { data, error } = await admin.storage
    .from("payment-proofs")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path: data.path });
}
