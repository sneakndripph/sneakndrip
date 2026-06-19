export const dynamic = "force-dynamic";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/layout/ChatWidget";
import CartGuard from "@/components/layout/CartGuard";
import VisitorTracker from "@/components/layout/VisitorTracker";
import { BRAND } from "@/lib/constants";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  noStore();
  let maintenance = false;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_settings?key=eq.maintenance_mode&select=value&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const rows: { value: string }[] = await res.json();
      maintenance = rows?.[0]?.value === "true";
    }
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
