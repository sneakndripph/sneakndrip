import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

export async function GET() {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name ?? "",
    role: u.app_metadata?.role ?? u.user_metadata?.role ?? "customer",
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at,
  }));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, password, full_name, role } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name ?? "", role: role ?? "customer" },
    app_metadata: { role: role ?? "customer" },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.user.id }, { status: 201 });
}

async function verifyPassword(email: string, password: string) {
  try {
    const env = validateEnv();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  } catch {
    return false;
  }
}

export async function PATCH(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, role, full_name, password } = await req.json();
  if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });

  if (role !== undefined) {
    if (!password) return NextResponse.json({ error: "Password required to change role" }, { status: 400 });
    const valid = await verifyPassword(caller.email ?? "", password);
    if (!valid) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    user_metadata: { role, full_name },
    app_metadata: { role },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });
  if (id === caller.id) return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
