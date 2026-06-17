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

// GET /api/notifications — fetch unread notifications for the current user
export async function GET() {
  const user = await getRequestingUser();
  if (!user?.email) return NextResponse.json({ notifications: [] });

  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select("id, title, message, order_number, type, is_read, created_at")
    .eq("user_email", user.email)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ notifications: data ?? [] });
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(req: NextRequest) {
  const user = await getRequestingUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { ids?: string[] };
  const admin = createAdminClient();

  if (body.ids?.length) {
    await admin.from("notifications").update({ is_read: true })
      .eq("user_email", user.email).in("id", body.ids);
  } else {
    await admin.from("notifications").update({ is_read: true })
      .eq("user_email", user.email);
  }
  return NextResponse.json({ ok: true });
}
