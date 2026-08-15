import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

async function requireAdmin() {
  try {
    const cookieStore = await cookies();
    const env = validateEnv();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.app_metadata?.role === "admin";
    if (!user || !isAdmin) return null;
    return user;
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, ban } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: ban ? "87600h" : "none",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void admin.from("activity_log").insert({
    action: ban ? "customer_banned" : "customer_unbanned",
    entity_type: "customer",
    entity_id: userId,
    actor_email: caller.email ?? null,
    details: null,
  });

  return NextResponse.json({ ok: true });
}
