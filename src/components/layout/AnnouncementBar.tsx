import { BRAND } from "@/lib/constants";
import { getSettings } from "@/lib/supabase/products";

export default async function AnnouncementBar() {
  const settings = await getSettings();
  const threshold = settings.free_shipping_threshold || "5000";
  const custom = settings.announcement_text?.trim();
  const text = custom || `Free Shipping on Orders ₱${Number(threshold).toLocaleString()}+  ·  100% Authentic Guaranteed  ·  GCash, Maya, Bank Transfer & COD Accepted`;

  return (
    <div
      className="text-center py-2.5 px-4 text-xs font-semibold tracking-widest uppercase"
      style={{ background: BRAND.teal, color: "#fff" }}
    >
      {text}
    </div>
  );
}
