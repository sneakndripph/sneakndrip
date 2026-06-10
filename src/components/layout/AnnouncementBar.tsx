import { BRAND } from "@/lib/constants";
import { getSettings } from "@/lib/supabase/products";

export default async function AnnouncementBar() {
  const settings = await getSettings();
  const threshold = settings.free_shipping_threshold || "5000";

  return (
    <div
      className="text-center py-2.5 px-4 text-xs font-semibold tracking-widest uppercase"
      style={{ background: BRAND.teal, color: "#fff" }}
    >
      Free Shipping on Orders &#8369;{Number(threshold).toLocaleString()}+&nbsp;&nbsp;·&nbsp;&nbsp;100% Authentic Guaranteed&nbsp;&nbsp;·&nbsp;&nbsp;GCash, Maya, Bank Transfer &amp; COD Accepted
    </div>
  );
}
