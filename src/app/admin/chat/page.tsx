import { createAdminClient } from "@/lib/supabase/admin-server";
import AdminChatClient from "@/components/admin/AdminChatClient";

export default async function AdminChatPage() {
  const admin = createAdminClient();
  const { data: convs } = await admin
    .from("conversations")
    .select("id, customer_name, customer_email, status, last_message, unread_admin, updated_at")
    .order("updated_at", { ascending: false });

  return <AdminChatClient initialConvs={convs ?? []} />;
}
