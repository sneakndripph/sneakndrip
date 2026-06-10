import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BRAND } from "@/lib/constants";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh" }}>
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
