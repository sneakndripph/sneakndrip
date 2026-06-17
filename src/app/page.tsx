import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BRAND } from "@/lib/constants";
import StorePage from "./(store)/page";

export const metadata: Metadata = {
  title: "Sneak N' Drip — Authentic Sneakers Philippines",
  description: "100% Authentic Sneakers. On Hand & Pre-Order. Shop the latest releases at Sneak N' Drip.",
};

export default function RootPage() {
  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh" }}>
      <Navbar />
      <main>
        <StorePage />
      </main>
      <Footer />
    </div>
  );
}
