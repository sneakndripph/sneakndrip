import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

// POST — create new conversation
export async function POST(req: NextRequest) {
  const { customer_name, customer_email, first_message } = await req.json() as {
    customer_name: string;
    customer_email?: string;
    first_message: string;
  };

  if (!customer_name?.trim() || !first_message?.trim()) {
    return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: conv, error: convErr } = await admin
    .from("conversations")
    .insert({
      customer_name: customer_name.trim(),
      customer_email: customer_email?.trim() ?? null,
      last_message: first_message.trim(),
      status: "open",
      unread_admin: 1,
    })
    .select("id")
    .single();

  if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 });

  const { error: msgErr } = await admin.from("messages").insert({
    conversation_id: conv.id,
    sender_type: "customer",
    sender_name: customer_name.trim(),
    content: first_message.trim(),
  });

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  return NextResponse.json({ id: conv.id }, { status: 201 });
}
