import { BRAND } from "@/lib/constants";

export default function AnnouncementBar() {
  return (
    <div
      className="text-center py-2.5 px-4 text-xs font-semibold tracking-widest uppercase"
      style={{ background: BRAND.teal, color: "#fff" }}
    >
      Free Shipping on Orders ₱3,000+&nbsp;&nbsp;·&nbsp;&nbsp;100% Authentic Guaranteed&nbsp;&nbsp;·&nbsp;&nbsp;GCash &amp; COD Accepted
    </div>
  );
}
