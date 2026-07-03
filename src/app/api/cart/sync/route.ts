import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireUser } from "@/lib/supabase/require-admin";
import { NextRequest, NextResponse } from "next/server";

// POST — upsert cart for the logged-in user
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  const { cart_items, subtotal } = await req.json();
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
