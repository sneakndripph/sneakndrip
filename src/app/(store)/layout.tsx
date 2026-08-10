import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/layout/ChatWidget";
import CartGuard from "@/components/layout/CartGuard";
import CartSyncer from "@/components/layout/CartSyncer";
import VisitorTracker from "@/components/layout/VisitorTracker";
import RouteTransition from "@/components/layout/RouteTransition";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const admin = createAdminClient();
  const [{ data: maintenanceRow }, { data: chatRow }] = await Promise.all([
    admin.from("store_settings").select("value").eq("key", "maintenance_mode").maybeSingle(),
    admin.from("store_settings").select("value").eq("key", "chat_widget_enabled").maybeSingle(),
  ]);
  if (maintenanceRow?.value === "true") redirect("/maintenance");
  const chatEnabled = chatRow?.value !== "false";

  return (
    <div className="bg-paper min-h-screen">
      <VisitorTracker />
      <CartGuard />
      <CartSyncer />
      <AnnouncementBar />
      <Navbar />
      <RouteTransition>{children}</RouteTransition>
      <Footer />
      {chatEnabled && <ChatWidget />}
    </div>
  );
}
