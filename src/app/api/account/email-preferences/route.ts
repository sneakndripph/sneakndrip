import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireUser } from "@/lib/supabase/require-admin";
import { findOrHealCustomer } from "@/lib/supabase/resolve-customer";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";

const PREFERENCE_FIELDS = "cart_reminders_enabled, new_arrivals_enabled, restock_alerts_enabled, newsletter_enabled";

const updatePreferencesSchema = z
  .object({
    cart_reminders_enabled: z.boolean().optional(),
    new_arrivals_enabled: z.boolean().optional(),
    restock_alerts_enabled: z.boolean().optional(),
    newsletter_enabled: z.boolean().optional(),
  })
  .strict()
  .refine(body => Object.keys(body).length > 0, "No preferences to update");

async function resolveCustomerId(): Promise<string | null> {
  const user = await requireUser();
  if (!user) return null;
  const customer = await findOrHealCustomer(user.id, user.email);
  return customer?.id ?? null;
}

export async function GET(req: NextRequest) {
  if (!rateLimit(getIP(req), 30, 60_000).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const customerId = await resolveCustomerId();
  if (!customerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = createAdminClient();
  const { data: preferences, error } = await admin
    .from("customers")
    .select(PREFERENCE_FIELDS)
    .eq("id", customerId)
    .single();
  if (error) return NextResponse.json({ error: "Failed to load email preferences" }, { status: 500 });

  return NextResponse.json({ preferences });
}

export async function PATCH(req: NextRequest) {
  if (!rateLimit(getIP(req), 30, 60_000).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const customerId = await resolveCustomerId();
  if (!customerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const result = await validateBody(req, updatePreferencesSchema);
  if ("error" in result) return result.error;

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("customers")
    .update(result.data)
    .eq("id", customerId)
    .select(`email, ${PREFERENCE_FIELDS}`)
    .single();
  if (error) return NextResponse.json({ error: "Failed to save email preferences" }, { status: 500 });
  const { email, ...preferences } = updated;

  // Mirror the newsletter toggle onto newsletter_subscribers, which is what
  // broadcasts and the token unsubscribe link actually read. A no-op when the
  // customer never subscribed — toggling on doesn't create a subscription.
  if (result.data.newsletter_enabled !== undefined) {
    const { error: syncError } = await admin
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: result.data.newsletter_enabled ? null : new Date().toISOString() })
      // Case-insensitive exact match; escape LIKE wildcards (`_` is common in emails).
      .ilike("email", email.replace(/[\\%_]/g, "\\$&"));
    if (syncError) console.error("[email-preferences] newsletter_subscribers sync failed:", syncError);
  }

  return NextResponse.json({ preferences });
}
