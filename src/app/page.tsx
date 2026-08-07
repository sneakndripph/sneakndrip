import type { Metadata } from "next";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StorePage from "./(store)/page";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sneak N' Drip — Authentic Sneakers Philippines",
  description: "100% Authentic Sneakers. On Hand & Pre-Order. Shop the latest releases at Sneak N' Drip.",
};

export default async function RootPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("store_settings").select("value").eq("key", "maintenance_mode").maybeSingle();
  if (data?.value === "true") redirect("/maintenance");
  return (
    <div className="bg-snd-bg min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <main>
        <StorePage />
      </main>
      <Footer />
    </div>
  );
}
