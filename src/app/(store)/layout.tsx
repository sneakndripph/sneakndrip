export const dynamic = "force-dynamic";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/layout/ChatWidget";
import CartGuard from "@/components/layout/CartGuard";
import VisitorTracker from "@/components/layout/VisitorTracker";
import { BRAND } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { redirect } from "next/navigation";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  let maintenance = false;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();
    maintenance = data?.value === "true";
  } catch { /* fail open */ }

  if (maintenance) redirect("/maintenance");

  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh" }}>
      <VisitorTracker />
      <CartGuard />
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
