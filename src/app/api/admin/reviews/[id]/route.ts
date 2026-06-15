import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey,
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
  const isAdmin = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestingUser();
  const isAdmin = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void admin.from("activity_log").insert({
    action: "review_deleted",
    entity_type: "review",
    entity_id: id,
    actor_email: user.email ?? null,
    details: null,
  });

  return NextResponse.json({ ok: true });
}
