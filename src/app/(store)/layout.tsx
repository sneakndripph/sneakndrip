import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MessengerChat from "@/components/layout/MessengerChat";
import { BRAND } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin-server";

async function getMessengerPageId(): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("store_settings").select("value").eq("key", "messenger_page_id").single();
    return data?.value ?? "";
  } catch {
    return "";
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const messengerPageId = await getMessengerPageId();
  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh" }}>
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <MessengerChat pageId={messengerPageId} />
    </div>
  );
}
