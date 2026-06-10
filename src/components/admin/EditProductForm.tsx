"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND, FONTS, SNEAKER_SIZES, BRANDS } from "@/lib/constants";
import { ArrowLeft, CheckCircle, X, GripVertical } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

type Product = Record<string, unknown> & {
  id: string;
  slug: string;
  images?: string[];
  product_sizes?: { size: string; stock: number }[];
};

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const initialSizes = (product.product_sizes ?? []) as { size: string; stock: number }[];
  const initialImages = (product.images ?? []) as string[];

  const [status, setStatus] = useState<"on-hand" | "pre-order">(
    (product.status as "on-hand" | "pre-order") ?? "on-hand"
  );
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>(initialSizes);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [keptUrls, setKeptUrls] = useState<string[]>(initialImages);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Drag state for existing images
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: String(product.name ?? ""),
    brand: String(product.brand ?? ""),
    colorway: String(product.colorway ?? ""),
    gender: String(product.gender ?? "Unisex"),
    sku: String(product.sku ?? ""),
    description: String(product.description ?? ""),
    srp: String(product.srp_price ?? ""),
    dp: String(product.downpayment_price ?? ""),
    full: String(product.full_payment_price ?? ""),
    etaStart: String(product.eta_start ?? ""),
    etaEnd: String(product.eta_end ?? ""),
  });
  const [visibility, setVisibility] = useState({
    published: Boolean(product.is_published ?? true),
    featured: Boolean(product.is_featured ?? false),
    trending: Boolean(product.is_trending ?? false),
  });

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }
  function toggleSize(s: string) {
    setSizes(prev => prev.find(x => x.size === s)
      ? prev.filter(x => x.size !== s)
      : [...prev, { size: s, stock: 1 }]);
  }
  function updateStock(s: string, stock: number) {
    setSizes(prev => prev.map(x => x.size === s ? { ...x, stock } : x));
  }

  function removeUrl(idx: number) {
    setKeptUrls(prev => prev.filter((_, i) => i !== idx));
  }
  function onUrlDragStart(idx: number) { setDragIdx(idx); }
  function onUrlDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx); }
  function onUrlDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const updated = [...keptUrls];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setKeptUrls(updated);
    setDragIdx(null);
    setDragOverIdx(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.brand || !form.full) {
      setError("Name, brand and full payment price are required.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("product", JSON.stringify({
        slug: product.slug,
        name: form.name, brand: form.brand,
        colorway: form.colorway || null, gender: form.gender,
        sku: form.sku || null, description: form.description || null,
        srp_price: Number(form.srp) || Number(form.full),
        downpayment_price: Number(form.dp) || Math.round(Number(form.full) * 0.5),
        full_payment_price: Number(form.full), status,
        eta_start: status === "pre-order" && form.etaStart ? form.etaStart : null,
        eta_end: status === "pre-order" && form.etaEnd ? form.etaEnd : null,
        is_published: visibility.published, is_featured: visibility.featured,
        is_trending: visibility.trending,
      }));
      fd.append("sizes", JSON.stringify(sizes));
      fd.append("keepUrls", JSON.stringify(keptUrls));
      newImages.forEach(img => fd.append("images", img));

      const res = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", body: fd });
      const result = await res.json();
      if (!res.ok) { setError(result.error ?? "Failed to save"); setSaving(false); return; }

      setSaved(true);
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: `${BRAND.teal}15` }}>
          <CheckCircle className="w-8 h-8" style={{ color: BRAND.teal }} />
        </div>
        <h2 style={{ fontFamily: FONTS.display, fontSize: "2rem", color: BRAND.black }}>CHANGES SAVED!</h2>
        <p className="mt-2 mb-6 text-sm" style={{ color: BRAND.muted }}>Product has been updated.</p>
        <div className="flex gap-3">
          <Link href="/admin/products"
            className="px-6 py-3 font-bold text-sm uppercase tracking-wider"
            style={{ background: BRAND.black, color: BRAND.bg }}>
            Back to Products
          </Link>
          <button onClick={() => { setSaved(false); router.refresh(); }}
            className="px-6 py-3 font-bold text-sm uppercase tracking-wider"
            style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.black }}>
            Keep Editing
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = { background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black };

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="p-2 transition-opacity hover:opacity-60"
          style={{ color: BRAND.muted }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.teal }}>Edit Product</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2rem", letterSpacing: "0.04em", color: BRAND.black }}>
            EDIT PRODUCT
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 text-sm font-medium rounded"
          style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Basic info */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-5" style={{ color: BRAND.black }}>Product Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Product Name *</label>
                  <input required value={form.name} onChange={e => set("name", e.target.value)}
                    className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Brand *</label>
                  <select required value={form.brand} onChange={e => set("brand", e.target.value)}
                    className="w-full px-4 py-3 text-sm focus:outline-none appearance-none" style={inputStyle}>
                    <option value="">Select brand…</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Colorway</label>
                  <input value={form.colorway} onChange={e => set("colorway", e.target.value)}
                    className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Gender</label>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)}
                    className="w-full px-4 py-3 text-sm focus:outline-none appearance-none" style={inputStyle}>
                    {["Unisex", "Men", "Women", "Kids"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>SKU</label>
                  <input value={form.sku} onChange={e => set("sku", e.target.value)}
                    className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Description</label>
                  <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)}
                    className="w-full px-4 py-3 text-sm focus:outline-none resize-none" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-5" style={{ color: BRAND.black }}>Pricing</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "SRP Price", key: "srp" },
                  { label: "Downpayment Price", key: "dp" },
                  { label: "Full Payment Price *", key: "full" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>{f.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: BRAND.muted }}>₱</span>
                      <input type="number" value={form[f.key as keyof typeof form]}
                        onChange={e => set(f.key, e.target.value)}
                        className="w-full pl-7 pr-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-5" style={{ color: BRAND.black }}>Availability</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {([
                  { value: "on-hand" as const, label: "On Hand", desc: "Available for immediate shipping" },
                  { value: "pre-order" as const, label: "Pre-Order", desc: "Reserve now, ships later" },
                ]).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                    className="p-4 text-left rounded-xl transition-all"
                    style={{ border: `2px solid ${status === opt.value ? BRAND.teal : BRAND.border}`, background: status === opt.value ? `${BRAND.teal}08` : "transparent" }}>
                    <p className="font-bold text-sm mb-0.5" style={{ color: BRAND.black }}>{opt.label}</p>
                    <p className="text-xs" style={{ color: BRAND.muted }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
              {status === "pre-order" && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>ETA Start</label>
                    <input type="date" value={form.etaStart} onChange={e => set("etaStart", e.target.value)}
                      className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>ETA End</label>
                    <input type="date" value={form.etaEnd} onChange={e => set("etaEnd", e.target.value)}
                      className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                  </div>
                </div>
              )}
            </div>

            {/* Sizes */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-2" style={{ color: BRAND.black }}>Sizes & Stock</h2>
              <p className="text-xs mb-4" style={{ color: BRAND.muted }}>Click a size to toggle it, then set the stock count.</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {SNEAKER_SIZES.map(s => {
                  const added = sizes.find(x => x.size === s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSize(s)}
                      className="px-3 py-2 text-xs font-semibold transition-all"
                      style={{ border: `1.5px solid ${added ? BRAND.teal : BRAND.border}`, background: added ? `${BRAND.teal}15` : "transparent", color: added ? BRAND.teal : BRAND.muted }}>
                      {s}
                    </button>
                  );
                })}
              </div>
              {sizes.length > 0 && (
                <div className="space-y-2">
                  {sizes.map(s => (
                    <div key={s.size} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-14 text-right" style={{ color: BRAND.black }}>{s.size}</span>
                      <input type="number" min="0" value={s.stock}
                        onChange={e => updateStock(s.size, Number(e.target.value))}
                        className="w-20 px-3 py-2 text-sm text-center focus:outline-none" style={inputStyle} />
                      <span className="text-xs" style={{ color: BRAND.muted }}>pairs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Existing images */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-4" style={{ color: BRAND.black }}>Product Images</h2>

              {keptUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] mb-2" style={{ color: BRAND.muted }}>
                    Drag to reorder · First photo is the cover
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {keptUrls.map((url, i) => (
                      <div key={url} draggable
                        onDragStart={() => onUrlDragStart(i)}
                        onDragOver={e => onUrlDragOver(e, i)}
                        onDrop={() => onUrlDrop(i)}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
                        style={{
                          border: `2px solid ${dragOverIdx === i ? BRAND.teal : i === 0 ? BRAND.black : BRAND.border}`,
                          opacity: dragIdx === i ? 0.4 : 1,
                          transition: "opacity 0.15s",
                        }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white rounded-sm"
                            style={{ background: BRAND.black }}>Cover</div>
                        )}
                        <div className="absolute top-1.5 right-1.5 flex gap-1">
                          <div className="w-5 h-5 flex items-center justify-center" style={{ color: "#fff", opacity: 0.7 }}>
                            <GripVertical className="w-3 h-3" />
                          </div>
                          <button type="button" onClick={() => removeUrl(i)}
                            className="w-6 h-6 rounded-sm flex items-center justify-center shadow"
                            style={{ background: BRAND.red }}>
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ImageUploader onChange={setNewImages} />
            </div>

            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-4" style={{ color: BRAND.black }}>Visibility</h2>
              <div className="space-y-3">
                {([["published", "Published"], ["featured", "Featured"], ["trending", "Trending"]] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium" style={{ color: BRAND.black }}>{label}</span>
                    <input type="checkbox" checked={visibility[key]}
                      onChange={e => setVisibility(v => ({ ...v, [key]: e.target.checked }))}
                      className="w-4 h-4" style={{ accentColor: BRAND.teal }} />
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <Link href="/admin/products"
              className="flex items-center justify-center w-full py-3 text-sm font-semibold transition-opacity hover:opacity-60"
              style={{ color: BRAND.muted }}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
