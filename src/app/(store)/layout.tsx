import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/layout/ChatWidget";
import CookieBanner from "@/components/layout/CookieBanner";
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2.5 focus:rounded-md focus:bg-ink focus:text-paper focus:text-body-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <VisitorTracker />
      <CartGuard />
      <CartSyncer />
      <AnnouncementBar />
      <Navbar />
      <main id="main-content">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <Footer />
      {chatEnabled && <ChatWidget />}
      <CookieBanner />
    </div>
  );
}
