"use client";
import { useState, useEffect, useRef } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, ChevronDown, Check, X } from "lucide-react";

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

type FormState = { code: string; type: string; value: string; min_order: string; max_uses: string; expires_at: string };
const EMPTY_FORM: FormState = { code: "", type: "percent", value: "", min_order: "", max_uses: "", expires_at: "" };

function couponToForm(c: Coupon): FormState {
  return {
    code: c.code,
    type: c.type,
    value: String(c.value),
    min_order: String(c.min_order || ""),
    max_uses: c.max_uses != null ? String(c.max_uses) : "",
    expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
  };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    fetch("/api/admin/coupons").then(r => r.json()).then(setCoupons).finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditingId(c.id);
    setForm(couponToForm(c));
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.value) { setError("Code and value are required"); return; }
    setSaving(true);
    setError("");

    if (editingId) {
      const res = await fetch(`/api/admin/coupons/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update coupon"); setSaving(false); return; }
      setCoupons(prev => prev.map(c => c.id === editingId ? { ...c, ...data } : c));
    } else {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create coupon"); setSaving(false); return; }
      setCoupons(prev => [data, ...prev]);
    }
    closeForm();
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
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
          style={{ background: BRAND.teal, color: "#fff" }}>
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-xl mb-6" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-sm uppercase tracking-wide" style={{ color: BRAND.black }}>
              {editingId ? "Edit Coupon" : "Create Coupon"}
            </p>
            <button type="button" onClick={closeForm} className="p-1 transition-opacity hover:opacity-70">
              <X className="w-4 h-4" style={{ color: BRAND.muted }} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20" required className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Type</label>
              <div className="relative" ref={typeRef}>
                <button type="button" onClick={() => setTypeOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold focus:outline-none"
                  style={{ ...inputStyle, border: `1px solid ${typeOpen ? BRAND.teal : BRAND.border}` }}>
                  <span style={{ color: BRAND.black }}>{form.type === "percent" ? "Percent (%)" : "Fixed Amount (₱)"}</span>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: BRAND.muted, transform: typeOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {typeOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden shadow-lg"
                    style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    {[{ value: "percent", label: "Percent (%)" }, { value: "fixed", label: "Fixed Amount (₱)" }].map(o => (
                      <button key={o.value} type="button"
                        onClick={() => { setForm(f => ({ ...f, type: o.value })); setTypeOpen(false); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors hover:opacity-80"
                        style={{
                          background: form.type === o.value ? `${BRAND.teal}10` : "transparent",
                          color: form.type === o.value ? BRAND.teal : BRAND.black,
                          borderBottom: `1px solid ${BRAND.border}`,
                          fontWeight: form.type === o.value ? 700 : 500,
                        }}>
                        {o.label}
                        {form.type === o.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              {saving ? (editingId ? "Saving…" : "Creating…") : (editingId ? "Save Changes" : "Create Coupon")}
            </button>
            <button type="button" onClick={closeForm}
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
                <tr key={c.id}
                  className="transition-colors hover:bg-black/[0.025] cursor-pointer"
                  style={{ borderBottom: `1px solid ${BRAND.border}` }}
                  onClick={() => openEdit(c)}>
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
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
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleActive(c)} className="transition-opacity hover:opacity-70">
                      {c.is_active
                        ? <ToggleRight className="w-5 h-5" style={{ color: BRAND.teal }} />
                        : <ToggleLeft className="w-5 h-5" style={{ color: BRAND.muted }} />}
                    </button>
                  </td>
                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
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
