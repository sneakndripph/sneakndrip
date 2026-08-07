import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/layout/ChatWidget";
import CartGuard from "@/components/layout/CartGuard";
import CartSyncer from "@/components/layout/CartSyncer";
import VisitorTracker from "@/components/layout/VisitorTracker";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const admin = createAdminClient();
  const { data } = await admin.from("store_settings").select("value").eq("key", "maintenance_mode").maybeSingle();
  if (data?.value === "true") redirect("/maintenance");

  return (
    <div className="bg-snd-bg min-h-screen">
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
