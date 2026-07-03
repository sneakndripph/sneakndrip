import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("id, sender_type, sender_name, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sender_name, content } = await req.json() as {
    sender_name?: string;
    content: string;
  };

  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  // Determine sender_type from server-side auth — never trust the request body
  let senderType: "customer" | "admin" = "customer";
  try {
    const cookieStore = await cookies();
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      "";
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, anonKey, {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.app_metadata?.role === "admin") senderType = "admin";
  } catch { /* default to customer */ }

  const admin = createAdminClient();

  const { data: msg, error } = await admin
    .from("messages")
    .insert({
      conversation_id: id,
      sender_type: senderType,
      sender_name: senderType === "admin" ? (sender_name ?? "Admin") : null,
      content: content.trim(),
    })
    .select("id, sender_type, sender_name, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("conversations").update({
    last_message: content.trim(),
    updated_at: new Date().toISOString(),
    unread_admin: senderType === "customer" ? 999 : 0,
  }).eq("id", id);

  return NextResponse.json(msg, { status: 201 });
}
