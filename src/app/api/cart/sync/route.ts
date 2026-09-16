import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireUser } from "@/lib/supabase/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";
import { priceSchema, quantitySchema } from "@/lib/validation/schemas";

const cartItemSchema = z
  .object({
    product: z
      .object({
        name: z.string().min(1),
        brand: z.string().min(1),
        images: z.array(z.string()).optional(),
        srp_price: priceSchema.optional(),
      })
      .passthrough(),
    size: z.string().min(1),
    quantity: quantitySchema,
    payment_type: z.enum(["downpayment", "full_payment"]),
    unit_price: priceSchema,
  })
  .passthrough();

const cartSyncSchema = z.object({
  cart_items: z.array(cartItemSchema).max(200),
  subtotal: priceSchema,
});

// POST — upsert cart for the logged-in user
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  const result = await validateBody(req, cartSyncSchema);
  if ("error" in result) return result.error;
  const { cart_items, subtotal } = result.data;
  const admin = createAdminClient();

  await admin.from("abandoned_carts").upsert(
    {
      email: user.email,
      cart_items,
      subtotal,
      updated_at: new Date().toISOString(),
      // Reset email timestamps if cart changes so we don't re-email stale carts
      email_1h_sent_at: null,
      email_24h_sent_at: null,
      recovered_at: null,
    },
    { onConflict: "email" }
  );

  return NextResponse.json({ ok: true });
}

// DELETE — mark cart as recovered (called after successful checkout)
export async function DELETE() {
  const user = await requireUser();
  if (!user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  const admin = createAdminClient();
  await admin
    .from("abandoned_carts")
    .update({ recovered_at: new Date().toISOString() })
    .eq("email", user.email)
    .is("recovered_at", null);

  return NextResponse.json({ ok: true });
}
