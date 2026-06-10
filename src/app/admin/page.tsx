import { BRAND, FONTS, MOCK_PRODUCTS } from "@/lib/constants";
import { TrendingUp, ShoppingBag, Package, Users, Clock, CheckCircle, Truck } from "lucide-react";

const METRICS = [
  { label: "Total Revenue", value: "₱248,500", sub: "+12% this week", icon: TrendingUp, color: BRAND.teal, bg: `rgba(91,184,180,0.12)` },
  { label: "Total Orders", value: "87", sub: "8 new today", icon: ShoppingBag, color: BRAND.black, bg: "rgba(13,13,13,0.08)" },
  { label: "Products", value: String(MOCK_PRODUCTS.length), sub: "3 pre-order active", icon: Package, color: BRAND.red, bg: "rgba(217,79,61,0.1)" },
  { label: "Customers", value: "234", sub: "+18 this week", icon: Users, color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
];

const RECENT_ORDERS = [
  { id: "SND-20250609", customer: "Marco R.", item: "Jordan 4 Black Cat (US 9)", total: "₱12,645", status: "paid", date: "Today, 2:14pm" },
  { id: "SND-20250609", customer: "Issa T.", item: "Nike Dunk Low Panda (US 8)", total: "₱9,145", status: "pending", date: "Today, 11:30am" },
  { id: "SND-20250608", customer: "Paulo C.", item: "Air Force 1 White (US 9.5)", total: "₱6,145", status: "shipped", date: "Yesterday" },
  { id: "SND-20250608", customer: "Karla M.", item: "NB 550 White Green (US 7.5)", total: "₱7,145", status: "delivered", date: "Yesterday" },
  { id: "SND-20250607", customer: "Dio V.", item: "Yeezy Slide Onyx (US 10)", total: "₱7,640", status: "processing", date: "June 7" },
];

const STATUS_CFG = {
  pending:    { icon: Clock, color: "#D97706", bg: "rgba(217,119,6,0.1)", label: "Pending" },
  paid:       { icon: CheckCircle, color: BRAND.teal, bg: `rgba(91,184,180,0.1)`, label: "Paid" },
  processing: { icon: Clock, color: "#6366F1", bg: "rgba(99,102,241,0.1)", label: "Processing" },
  shipped:    { icon: Truck, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", label: "Shipped" },
  delivered:  { icon: CheckCircle, color: "#10B981", bg: "rgba(16,185,129,0.1)", label: "Delivered" },
} as const;

const LOW_STOCK = MOCK_PRODUCTS.filter(p => p.sizes.some(s => s.stock <= 2 && s.stock > 0)).slice(0, 4);

export default function AdminDashboard() {
  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Sneak N&apos; Drip</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
          DASHBOARD
        </h1>
        <p className="text-sm mt-1" style={{ color: BRAND.muted }}>Monday, June 9, 2025</p>
      </div>

      {/* Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {METRICS.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="p-5 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: m.bg }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${BRAND.teal}12`, color: BRAND.teal }}>{m.sub}</span>
              </div>
              <p style={{ fontFamily: FONTS.display, fontSize: "2rem", color: BRAND.black, letterSpacing: "0.03em", lineHeight: 1 }}>
                {m.value}
              </p>
              <p className="text-xs mt-1 uppercase tracking-widest font-semibold" style={{ color: BRAND.muted }}>{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
            <h2 className="font-black" style={{ fontFamily: FONTS.display, fontSize: "1.2rem", letterSpacing: "0.04em", color: BRAND.black }}>
              RECENT ORDERS
            </h2>
            <a href="/admin/orders" className="text-xs font-bold transition-opacity hover:opacity-60" style={{ color: BRAND.teal }}>
              View All →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  {["Order ID", "Customer", "Item", "Total", "Status", "Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                      style={{ color: BRAND.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map((order, i) => {
                  const cfg = STATUS_CFG[order.status as keyof typeof STATUS_CFG];
                  const Icon = cfg.icon;
                  return (
                    <tr key={i} className="transition-colors hover:bg-black/[0.02]"
                      style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <td className="px-4 py-3.5 text-xs font-bold" style={{ color: BRAND.black }}>{order.id}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold" style={{ color: BRAND.black }}>{order.customer}</td>
                      <td className="px-4 py-3.5 text-xs max-w-[160px] truncate" style={{ color: BRAND.muted }}>{order.item}</td>
                      <td className="px-4 py-3.5 text-xs font-bold" style={{ color: BRAND.black }}>{order.total}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>{order.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Low stock alert */}
          <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: BRAND.red }} />
              <h3 className="font-black text-sm" style={{ color: BRAND.black }}>LOW STOCK ALERT</h3>
            </div>
            <div className="p-4 space-y-3">
              {LOW_STOCK.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: BRAND.black }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: BRAND.muted }}>
                      {p.sizes.filter(s => s.stock > 0 && s.stock <= 2).map(s => `${s.size} (${s.stock})`).join(" · ")}
                    </p>
                  </div>
                  <span className="ml-2 text-[10px] font-bold px-2 py-0.5"
                    style={{ background: `${BRAND.red}10`, color: BRAND.red }}>Low</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="font-black text-sm" style={{ color: BRAND.black }}>QUICK ACTIONS</h3>
            </div>
            <div className="p-3 space-y-2">
              {[
                { label: "Add New Product", href: "/admin/products/new", color: BRAND.teal },
                { label: "View Pending Orders", href: "/admin/orders?status=pending", color: BRAND.black },
                { label: "View All Customers", href: "/admin/customers", color: BRAND.black },
              ].map(a => (
                <a key={a.label} href={a.href}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-colors"
                  style={{ background: `${a.color}08`, color: a.color }}>
                  {a.label} →
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
