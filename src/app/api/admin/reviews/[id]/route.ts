import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const env = validateEnv();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestingUser();
  const isAdmin = user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { is_verified } = await req.json() as { is_verified: boolean };
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").update({ is_verified }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void admin.from("activity_log").insert({
    action: is_verified ? "review_approved" : "review_updated",
    entity_type: "review",
    entity_id: id,
    actor_email: user.email ?? null,
    details: null,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestingUser();
  const isAdmin = user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason } = await req.json().catch(() => ({ reason: undefined })) as { reason?: string };
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void admin.from("activity_log").insert({
    action: reason ? "review_rejected" : "review_deleted",
    entity_type: "review",
    entity_id: id,
    actor_email: user.email ?? null,
    details: reason ? { reason } : null,
  });

  return NextResponse.json({ ok: true });
}
