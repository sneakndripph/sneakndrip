import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

// GET — fetch messages for a conversation
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

// POST — send a message (customer or admin)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sender_type, sender_name, content } = await req.json() as {
    sender_type: "customer" | "admin";
    sender_name?: string;
    content: string;
  };

  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: msg, error } = await admin
    .from("messages")
    .insert({ conversation_id: id, sender_type, sender_name: sender_name ?? "Admin", content: content.trim() })
    .select("id, sender_type, sender_name, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update conversation last_message + unread count
  await admin.from("conversations").update({
    last_message: content.trim(),
    updated_at: new Date().toISOString(),
    unread_admin: sender_type === "customer" ? 999 : 0,
  }).eq("id", id);

  return NextResponse.json(msg, { status: 201 });
}
