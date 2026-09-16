import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-admin";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { orderNumberSchema } from "@/lib/validation/schemas";

// type stays a loose optional string (no enum) -- only ever compared for
// equality against "balance_proof", matching this route's pre-existing
// permissiveness for that field.
const uploadProofFieldsSchema = z.object({
  orderNumber: orderNumberSchema,
  type: z.string().trim().optional(),
});

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  heic: "image/heic",
  heif: "image/heif",
};
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 5, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Missing file or orderNumber" }, { status: 400 });
  }

  const parsed = uploadProofFieldsSchema.safeParse({
    orderNumber: formData.get("orderNumber") ?? undefined,
    type: formData.get("type") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Missing file or orderNumber" }, { status: 400 });
  }
  const { orderNumber, type } = parsed.data;

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const contentType = EXT_MIME[ext];
  if (!contentType) {
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
    .upload(path, arrayBuffer, { contentType, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path: data.path });
}
