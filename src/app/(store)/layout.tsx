import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/layout/ChatWidget";
import CartGuard from "@/components/layout/CartGuard";
import CartSyncer from "@/components/layout/CartSyncer";
import VisitorTracker from "@/components/layout/VisitorTracker";
import { BRAND } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { redirect } from "next/navigation";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const admin = createAdminClient();
  const { data } = await admin.from("store_settings").select("value").eq("key", "maintenance_mode").maybeSingle();
  if (data?.value === "true") redirect("/maintenance");

  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh" }}>
      <VisitorTracker />
      <CartGuard />
      <CartSyncer />
      <AnnouncementBar />
      <Navbar />
      <main className="page-transition">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
