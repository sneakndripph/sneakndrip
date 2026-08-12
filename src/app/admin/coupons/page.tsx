"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Copy, ToggleLeft, ToggleRight, Tag, Percent, X } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";

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

function couponStatus(c: Coupon): { label: string; cls: string } {
  if (!c.is_active) return { label: "Disabled", cls: "text-ink-3 bg-paper-2" };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: "Expired", cls: "text-state-error bg-state-error/10" };
  return { label: "Active", cls: "text-state-onhand bg-state-onhand/10" };
}

type DiscountProduct = {
  id: string;
  name: string;
  brand: string;
  full_payment_price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
};

type DiscountEdit = { salePrice: string; saleStart: string; saleEnd: string };

function toDatetimeLocal(val: string | null): string {
  if (!val) return "";
  return String(val).slice(0, 16);
}

const inputCls = "w-full px-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast";
const labelCls = "block text-admin-eyebrow text-ink-3 mb-1.5";

const TABS = [
  { id: "coupons" as const, label: "Coupons", icon: Tag },
  { id: "discounts" as const, label: "Scheduled Discounts", icon: Percent },
];

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<"coupons" | "discounts">("coupons");

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  // Discounts state
  const [products, setProducts] = useState<DiscountProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingDiscountProduct, setEditingDiscountProduct] = useState<DiscountProduct | null>(null);
  const [discountEdit, setDiscountEdit] = useState<DiscountEdit>({ salePrice: "", saleStart: "", saleEnd: "" });
  const [discountError, setDiscountError] = useState("");
  const [savingDiscount, setSavingDiscount] = useState(false);

  const { confirm: confirmCouponDelete, dialog: couponDeleteDialog } = useConfirmDialog();
  const { confirm: confirmClearDiscount, dialog: clearDiscountDialog } = useConfirmDialog();

  useEffect(() => {
    fetch("/api/admin/coupons").then(r => r.json()).then(setCoupons).finally(() => setLoadingCoupons(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "discounts" || products.length > 0 || loadingProducts) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingProducts(true);
    fetch("/api/admin/products?limit=200")
      .then(r => r.json())
      .then(d => setProducts((d.products ?? d) as DiscountProduct[]))
      .finally(() => setLoadingProducts(false));
  }, [activeTab, products.length, loadingProducts]);

  // --- Coupon handlers ---
  function openCreate() {
    setEditingId(null); setForm(EMPTY_FORM); setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function openEdit(c: Coupon) {
    setEditingId(c.id); setForm(couponToForm(c)); setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function closeForm() { setEditingId(null); setForm(EMPTY_FORM); setError(""); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.value) { setError("Code and value are required"); return; }
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/coupons/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to save"); return; }
        setCoupons(prev => prev.map(c => c.id === editingId ? { ...c, ...data } : c));
      } else {
        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Failed to save"); return; }
        setCoupons(prev => [data, ...prev]);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  function toggleActive(c: Coupon) {
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !c.is_active } : x));
    fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
  }

  async function handleDelete(id: string) {
    const ok = await confirmCouponDelete({
      title: "Delete this coupon?",
      description: "Existing uses will not be affected. New redemptions will be blocked.",
      confirmLabel: "Delete coupon",
      variant: "destructive",
    });
    if (!ok) return;
    setCoupons(prev => prev.filter(c => c.id !== id));
    if (editingId === id) closeForm();
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
  }

  async function handleDuplicate(c: Coupon) {
    const copyForm: FormState = {
      code: `${c.code}-COPY`,
      type: c.type,
      value: String(c.value),
      min_order: String(c.min_order || ""),
      max_uses: c.max_uses != null ? String(c.max_uses) : "",
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
    };
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copyForm),
    });
    if (res.ok) {
      const data = await res.json();
      setCoupons(prev => [data, ...prev]);
    }
  }

  // --- Discount handlers ---
  function openDiscountEdit(p: DiscountProduct) {
    setEditingDiscountProduct(p);
    setDiscountEdit({
      salePrice: p.sale_price != null ? String(p.sale_price) : "",
      saleStart: toDatetimeLocal(p.sale_start),
      saleEnd: toDatetimeLocal(p.sale_end),
    });
    setDiscountError("");
  }

  function closeDiscountEdit() {
    setEditingDiscountProduct(null);
    setDiscountEdit({ salePrice: "", saleStart: "", saleEnd: "" });
    setDiscountError("");
  }

  async function saveDiscount(p: DiscountProduct) {
    const salePriceNum = discountEdit.salePrice ? Number(discountEdit.salePrice) : 0;
    if (salePriceNum > 0 && discountEdit.saleStart) {
      const startMs = new Date(discountEdit.saleStart).getTime();
      const nowMs = Date.now();
      if (startMs < nowMs - 3600000) {
        setDiscountError("Sale start must not be more than 1 hour in the past.");
        return;
      }
    }
    setSavingDiscount(true);
    setDiscountError("");

    const fd = new FormData();
    fd.append("product", JSON.stringify({
      name: p.name,
      sale_price: salePriceNum > 0 ? salePriceNum : null,
      sale_start: salePriceNum > 0 && discountEdit.saleStart ? discountEdit.saleStart : null,
      sale_end: salePriceNum > 0 && discountEdit.saleEnd ? discountEdit.saleEnd : null,
    }));
    fd.append("sizes", JSON.stringify([]));

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: "PATCH", body: fd });
      if (res.ok) {
        setProducts(prev => prev.map(x => x.id === p.id ? {
          ...x,
          sale_price: salePriceNum > 0 ? salePriceNum : null,
          sale_start: salePriceNum > 0 && discountEdit.saleStart ? discountEdit.saleStart : null,
          sale_end: salePriceNum > 0 && discountEdit.saleEnd ? discountEdit.saleEnd : null,
        } : x));
        closeDiscountEdit();
      } else {
        const err = await res.json().catch(() => ({}));
        setDiscountError(err.error || "Failed to save discount");
      }
    } finally {
      setSavingDiscount(false);
    }
  }

  async function clearDiscount(p: DiscountProduct) {
    const ok = await confirmClearDiscount({
      title: "Delete this scheduled discount?",
      description: "The scheduled promotion will be removed and won't run.",
      confirmLabel: "Delete discount",
      variant: "destructive",
    });
    if (!ok) return;

    const fd = new FormData();
    fd.append("product", JSON.stringify({ name: p.name, sale_price: null, sale_start: null, sale_end: null }));
    fd.append("sizes", JSON.stringify([]));

    const res = await fetch(`/api/admin/products/${p.id}`, { method: "PATCH", body: fd });
    if (res.ok) {
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, sale_price: null, sale_start: null, sale_end: null } : x));
      toast.success("Discount cleared");
    } else {
      toast.error("Couldn't clear discount. Try again.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-admin-eyebrow text-ink-3 mb-1">Marketing</p>
          <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Coupons &amp; Discounts</h1>
        </div>
        {activeTab === "coupons" && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 text-admin-sm font-medium rounded-md bg-ink text-paper hover:bg-ink-2 transition-colors duration-admin-fast">
            <Plus className="w-4 h-4" /> New voucher
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-paper-2 rounded-md p-1 mb-6">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-admin-sm rounded transition-colors duration-admin-fast ${
                activeTab === t.id ? "bg-paper text-ink font-medium" : "text-ink-3 hover:text-ink"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Coupons tab: split view */}
      {activeTab === "coupons" && (
        <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
          {/* List */}
          <div className="bg-paper border border-line rounded-md overflow-hidden">
            {loadingCoupons ? (
              <div className="py-12 text-center text-admin text-ink-3">Loading…</div>
            ) : coupons.length === 0 ? (
              <div className="py-16 text-center">
                <Tag className="w-9 h-9 mx-auto mb-3 text-ink-3" />
                <p className="text-admin-title text-ink">No coupons yet</p>
                <p className="text-admin-sm text-ink-3 mt-1 mb-4">Create your first coupon to offer discounts.</p>
                <button onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-admin-sm font-medium rounded-md bg-ink text-paper hover:bg-ink-2 transition-colors duration-admin-fast">
                  <Plus className="w-4 h-4" /> Create your first coupon
                </button>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-paper-2 border-b border-line-strong">
                        {["Code", "Type", "Value", "Uses", "Expiry", "Status", ""].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {coupons.map(c => {
                        const status = couponStatus(c);
                        return (
                          <tr key={c.id} onClick={() => openEdit(c)}
                            className={`cursor-pointer transition-colors duration-admin-fast ${
                              editingId === c.id ? "bg-admin-row-hover" : "even:bg-paper-2 hover:bg-admin-row-hover"
                            }`}>
                            <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">{c.code}</td>
                            <td className="px-4 py-3.5 text-admin-sm text-ink-3 capitalize">{c.type}</td>
                            <td className="px-4 py-3.5 text-admin-sm text-ink">
                              {c.type === "percent" ? `${c.value}%` : `₱${Number(c.value).toLocaleString()}`}
                            </td>
                            <td className="px-4 py-3.5 text-admin-sm text-ink-3">
                              {c.uses}{c.max_uses ? ` / ${c.max_uses}` : ""}
                            </td>
                            <td className="px-4 py-3.5 text-admin-sm text-ink-3">
                              {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Never"}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`text-admin-micro font-medium px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                            </td>
                            <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => toggleActive(c)} title={c.is_active ? "Disable" : "Enable"}
                                  className="p-1.5 rounded hover:bg-paper-3 transition-colors duration-admin-fast">
                                  {c.is_active
                                    ? <ToggleRight className="w-4 h-4 text-ink" />
                                    : <ToggleLeft className="w-4 h-4 text-ink-3" />}
                                </button>
                                <button onClick={() => handleDuplicate(c)} title="Duplicate"
                                  className="p-1.5 rounded hover:bg-paper-3 transition-colors duration-admin-fast">
                                  <Copy className="w-3.5 h-3.5 text-ink-3" />
                                </button>
                                <button onClick={() => handleDelete(c.id)} title="Delete"
                                  className="p-1.5 rounded hover:bg-paper-3 transition-colors duration-admin-fast">
                                  <Trash2 className="w-3.5 h-3.5 text-state-error" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden divide-y divide-line">
                  {coupons.map(c => {
                    const status = couponStatus(c);
                    return (
                      <div key={c.id} onClick={() => openEdit(c)}
                        className={`px-4 py-3.5 ${editingId === c.id ? "bg-admin-row-hover" : ""}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-admin-sm font-semibold text-ink">{c.code}</p>
                          <span className={`text-admin-micro font-medium px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                        </div>
                        <p className="text-admin-micro text-ink-3 mt-1">
                          {c.type === "percent" ? `${c.value}%` : `₱${Number(c.value).toLocaleString()}`} · {c.uses}{c.max_uses ? `/${c.max_uses}` : ""} uses · {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) : "Never expires"}
                        </p>
                        <div className="flex items-center gap-3 mt-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => toggleActive(c)} className="text-admin-micro font-medium text-ink-2">
                            {c.is_active ? "Disable" : "Enable"}
                          </button>
                          <button onClick={() => handleDuplicate(c)} className="text-admin-micro font-medium text-ink-2">Duplicate</button>
                          <button onClick={() => handleDelete(c.id)} className="text-admin-micro font-medium text-state-error">Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Edit / create form panel */}
          <div ref={formRef} className="bg-paper border border-line rounded-md p-5 lg:sticky lg:top-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-admin-title text-ink">{editingId ? "Edit voucher" : "New voucher"}</p>
              {editingId && (
                <button onClick={closeForm} className="p-1 text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Code *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER20" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: "percent", label: "Percent" }, { value: "fixed", label: "Fixed" }].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                      className={`py-2.5 text-admin-sm font-medium rounded-md border transition-colors duration-admin-fast ${
                        form.type === opt.value ? "border-ink bg-admin-row-hover text-ink" : "border-line text-ink-3 hover:border-line-strong"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Value * {form.type === "percent" ? "(%)" : "(₱)"}</label>
                <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  type="number" min="0" placeholder={form.type === "percent" ? "20" : "200"} required className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Min. purchase (₱)</label>
                <input value={form.min_order} onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))}
                  type="number" min="0" placeholder="0" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Max uses</label>
                <input value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  type="number" min="0" placeholder="Unlimited" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Expiry date</label>
                <input value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  type="date" className={inputCls} />
              </div>

              {error && <p className="text-admin-sm text-state-error">{error}</p>}

              <div className="flex gap-2.5 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-admin-sm font-medium rounded-md bg-ink text-paper hover:bg-ink-2 disabled:opacity-50 transition-colors duration-admin-fast">
                  {saving ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={closeForm}
                  className="px-5 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount edit modal */}
      {editingDiscountProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60"
          onClick={e => { if (e.target === e.currentTarget) closeDiscountEdit(); }}>
          <div className="w-full max-w-md rounded-md overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <div>
                <p className="text-admin-title text-ink">Scheduled discount</p>
                <p className="text-admin-micro text-ink-3 mt-0.5 truncate max-w-[260px]">{editingDiscountProduct.name}</p>
              </div>
              <button type="button" onClick={closeDiscountEdit} className="p-1 text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-admin-sm">
                <span className="text-ink-3">Full price</span>
                <span className="font-semibold text-ink">₱{Number(editingDiscountProduct.full_payment_price).toLocaleString()}</span>
              </div>
              <div>
                <label className={labelCls}>Sale price (₱ — leave blank to clear sale)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-sm font-medium text-ink-3">₱</span>
                  <input type="number" min="0" value={discountEdit.salePrice}
                    onChange={e => setDiscountEdit(d => ({ ...d, salePrice: e.target.value }))}
                    placeholder="0" className={`${inputCls} pl-7`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Sale start</label>
                <input type="datetime-local" value={discountEdit.saleStart}
                  onChange={e => setDiscountEdit(d => ({ ...d, saleStart: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sale end</label>
                <input type="datetime-local" value={discountEdit.saleEnd}
                  onChange={e => setDiscountEdit(d => ({ ...d, saleEnd: e.target.value }))} className={inputCls} />
              </div>
              {discountError && <p className="text-admin-sm text-state-error">{discountError}</p>}
            </div>
            <div className="flex gap-2.5 px-6 pb-6">
              <button onClick={() => saveDiscount(editingDiscountProduct)} disabled={savingDiscount}
                className="flex-1 py-2.5 text-admin-sm font-medium rounded-md bg-ink text-paper hover:bg-ink-2 disabled:opacity-50 transition-colors duration-admin-fast">
                {savingDiscount ? "Saving…" : "Save discount"}
              </button>
              <button onClick={closeDiscountEdit}
                className="px-5 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled discounts tab */}
      {activeTab === "discounts" && (
        <div className="bg-paper border border-line rounded-md overflow-hidden">
          {loadingProducts ? (
            <div className="py-12 text-center text-admin text-ink-3">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <Percent className="w-9 h-9 mx-auto mb-3 text-ink-3" />
              <p className="text-admin-title text-ink">No products yet</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-paper-2 border-b border-line-strong">
                      {["Product", "Full price", "Sale price", "Start", "End", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {products.map(p => (
                      <tr key={p.id} onClick={() => openDiscountEdit(p)}
                        className="cursor-pointer even:bg-paper-2 hover:bg-admin-row-hover transition-colors duration-admin-fast">
                        <td className="px-4 py-3">
                          <p className="text-admin-sm font-semibold text-ink">{p.name}</p>
                          <p className="text-admin-micro text-ink-3">{p.brand}</p>
                        </td>
                        <td className="px-4 py-3 text-admin-sm font-semibold text-ink">
                          ₱{Number(p.full_payment_price).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {p.sale_price ? (
                            <span className="text-admin-sm font-semibold text-state-error">₱{Number(p.sale_price).toLocaleString()}</span>
                          ) : (
                            <span className="text-admin-sm text-ink-3">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-admin-sm text-ink-3">
                          {p.sale_start ? new Date(p.sale_start).toLocaleString("en-PH", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-admin-sm text-ink-3">
                          {p.sale_end ? new Date(p.sale_end).toLocaleString("en-PH", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openDiscountEdit(p)}
                              className="text-admin-micro font-medium px-3 py-1.5 rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                              Edit
                            </button>
                            {p.sale_price && (
                              <button onClick={() => clearDiscount(p)} title="Delete scheduled discount"
                                className="p-1.5 rounded-md border border-line text-state-error hover:bg-state-error/5 transition-colors duration-admin-fast">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-line">
                {products.map(p => (
                  <div key={p.id} onClick={() => openDiscountEdit(p)} className="px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-admin-sm font-semibold text-ink">{p.name}</p>
                        <p className="text-admin-micro text-ink-3">{p.brand}</p>
                      </div>
                      {p.sale_price && (
                        <button onClick={e => { e.stopPropagation(); clearDiscount(p); }} title="Delete scheduled discount"
                          className="shrink-0 p-1.5 rounded-md border border-line text-state-error hover:bg-state-error/5 transition-colors duration-admin-fast">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-admin-sm font-semibold text-ink">₱{Number(p.full_payment_price).toLocaleString()}</span>
                      {p.sale_price && (
                        <span className="text-admin-sm font-semibold text-state-error">→ ₱{Number(p.sale_price).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {couponDeleteDialog}
      {clearDiscountDialog}
    </div>
  );
}
