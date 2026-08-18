import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public, unauthenticated: lets the register/login forms check whether an
 * email is already registered — and with which provider(s) — before
 * submitting. Same-origin only by omission (no CORS headers are set, so
 * browsers block cross-origin reads of the response).
 */
export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 20, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const admin = createAdminClient();
  // supabase-js has no server-side email filter for listUsers() — only
  // pagination — so we page through and match in memory. Fine at this
  // store's user volume; swap for a public.customers lookup (synced by the
  // handle_new_user trigger) if the user base grows past a few thousand.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: "Lookup failed" }, { status: 500 });

  const normalized = email.toLowerCase();
  const match = data.users.find(u => u.email?.toLowerCase() === normalized);
  if (!match) return NextResponse.json({ exists: false, providers: null });

  const providers = [...new Set((match.identities ?? []).map(i => i.provider))];
  return NextResponse.json({ exists: true, providers });
}
