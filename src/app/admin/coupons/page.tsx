"use client";
import { useState, useEffect } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order: number;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

const EMPTY_FORM = { code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/coupons").then(r => r.json()).then(setCoupons).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.value) { setError("Code and value are required"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to create coupon"); setSaving(false); return; }
    setCoupons(prev => [data, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  }

  async function toggleActive(c: Coupon) {
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    setCoupons(prev => prev.filter(c => c.id !== id));
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
  }

  const inputCls = "w-full px-3 py-2.5 text-sm focus:outline-none";
  const inputStyle = { background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black };

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Promotions</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>COUPONS</h1>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
          style={{ background: BRAND.teal, color: "#fff" }}>
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-6 rounded-xl mb-6" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
          <p className="font-black text-sm uppercase tracking-wide mb-4" style={{ color: BRAND.black }}>Create Coupon</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20" required className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className={inputCls} style={inputStyle}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed Amount (₱)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                Value * {form.type === "percent" ? "(%)" : "(₱)"}
              </label>
              <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                type="number" min="0" placeholder={form.type === "percent" ? "20" : "200"} required
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Min Order (₱)</label>
              <input value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))}
                type="number" min="0" placeholder="0 = no minimum"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Max Uses</label>
              <input value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                type="number" min="0" placeholder="Leave blank for unlimited"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Expires At</label>
              <input value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                type="date" className={inputCls} style={inputStyle} />
            </div>
          </div>
          {error && <p className="mt-3 text-sm font-semibold" style={{ color: BRAND.red }}>{error}</p>}
          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              {saving ? "Creating…" : "Create Coupon"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(""); }}
              className="px-6 py-2.5 text-sm font-bold uppercase tracking-wide"
              style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: BRAND.muted }}>Loading…</div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: BRAND.black }} />
            <p style={{ fontFamily: FONTS.display, fontSize: "1.3rem", color: BRAND.muted }}>NO COUPONS YET</p>
            <p className="text-sm mt-1" style={{ color: BRAND.mutedLight }}>Create your first coupon to offer discounts.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
                {["Code", "Type", "Discount", "Min Order", "Uses", "Expires", "Active", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                    style={{ color: BRAND.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-black px-2 py-0.5 rounded"
                      style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>
                      {c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs capitalize" style={{ color: BRAND.muted }}>{c.type}</td>
                  <td className="px-4 py-3.5 text-xs font-bold" style={{ color: BRAND.black }}>
                    {c.type === "percent" ? `${c.value}%` : `₱${Number(c.value).toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>
                    {Number(c.min_order) > 0 ? `₱${Number(c.min_order).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>
                    {c.uses}{c.max_uses ? ` / ${c.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Never"}
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => toggleActive(c)} className="transition-opacity hover:opacity-70">
                      {c.is_active
                        ? <ToggleRight className="w-5 h-5" style={{ color: BRAND.teal }} />
                        : <ToggleLeft className="w-5 h-5" style={{ color: BRAND.muted }} />}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => handleDelete(c.id)} className="transition-opacity hover:opacity-70">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: BRAND.red }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
