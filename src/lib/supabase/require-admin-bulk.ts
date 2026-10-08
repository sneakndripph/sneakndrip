import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { rateLimit } from "@/lib/rate-limit";

// Bulk writes touch many rows per call; keyed per admin rather than per IP.
const BULK_LIMIT = 10;
const BULK_WINDOW_MS = 60_000;

/**
 * Admin check + per-admin rate limit for bulk endpoints. `scope` keeps each
 * route's counter separate (e.g. "orders", "customers").
 */
export async function requireAdminBulk(scope: string): Promise<{ user: User } | { error: NextResponse }> {
  const user = await requireAdmin();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { allowed } = await rateLimit(`admin-${scope}-bulk:${user.id}`, BULK_LIMIT, BULK_WINDOW_MS);
  if (!allowed) {
    return { error: NextResponse.json({ error: "Too many bulk actions. Try again in a minute." }, { status: 429 }) };
  }
  return { user };
}
