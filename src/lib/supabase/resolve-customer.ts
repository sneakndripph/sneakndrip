import { createAdminClient } from "@/lib/supabase/admin-server";

export interface ResolvedCustomer {
  id: string;
  full_name: string;
  mobile: string | null;
}

/**
 * Looks up the customers row for a signed-in user by auth_user_id. If none
 * is found, falls back to an email match -- covering rows created by a
 * prior guest checkout whose auth_user_id was never linked (see migration
 * 040) -- and heals the link. Uses the admin client throughout: RLS hides
 * an unlinked row from the user's own session (auth_user_id != auth.uid()),
 * so both the fallback read and the healing write must bypass it. Never
 * overwrites a row that already has a different auth_user_id.
 */
export async function findOrHealCustomer(userId: string, email: string | null | undefined): Promise<ResolvedCustomer | null> {
  const admin = createAdminClient();

  const { data: customer } = await admin
    .from("customers")
    .select("id, full_name, mobile")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (customer) return customer;

  if (!email) return null;

  const { data: orphaned } = await admin
    .from("customers")
    .select("id, full_name, mobile, auth_user_id")
    .eq("email", email)
    .maybeSingle();
  if (!orphaned || orphaned.auth_user_id) return null;

  const { data: healed } = await admin
    .from("customers")
    .update({ auth_user_id: userId })
    .eq("id", orphaned.id)
    .is("auth_user_id", null)
    .select("id, full_name, mobile")
    .maybeSingle();

  return healed ?? null;
}
