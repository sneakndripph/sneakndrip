"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SNEAKER_SIZES, BRANDS, GENDERS } from "@/lib/constants";
import { ArrowLeft, ChevronDown, Check, Copy, Trash2 } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-admin-fast ${checked ? "bg-ink" : "bg-line-strong"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-paper transition-transform duration-admin-fast ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

type SizeRow = { size: string; stock: number; enabled: boolean };

type Product = Record<string, unknown> & {
  id: string;
  slug: string;
  images?: string[];
  product_sizes?: { size: string; stock: number }[];
  created_at?: string;
  updated_at?: string;
};

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const initialSizes = (product.product_sizes ?? []) as { size: string; stock: number }[];
  const initialImages = (product.images ?? []) as string[];

  const [name, setName] = useState(String(product.name ?? ""));
  const [slug, setSlug] = useState(String(product.slug ?? ""));
  const [brand, setBrand] = useState(String(product.brand ?? ""));
  const [gender, setGender] = useState(String(product.gender ?? "Unisex"));
  const [colorway, setColorway] = useState(String(product.colorway ?? ""));
  const [sku, setSku] = useState(String(product.sku ?? ""));
  const [description, setDescription] = useState(String(product.description ?? ""));

  const [status, setStatus] = useState<"on-hand" | "pre-order">(
    (product.status as "on-hand" | "pre-order") ?? "on-hand"
  );
  const [etaStart, setEtaStart] = useState(String(product.eta_start ?? ""));
  const [etaEnd, setEtaEnd] = useState(String(product.eta_end ?? ""));

  const [srp, setSrp] = useState(String(product.srp_price ?? ""));
  const [dp, setDp] = useState(String(product.downpayment_price ?? ""));
  const [full, setFull] = useState(String(product.full_payment_price ?? ""));
  const [cost, setCost] = useState(String(product.cost_price ?? ""));

  const [sizeRows, setSizeRows] = useState<SizeRow[]>(() =>
    SNEAKER_SIZES.map(s => {
      const existing = initialSizes.find(x => x.size === s);
      return { size: s, stock: existing?.stock ?? 0, enabled: !!existing };
    })
  );
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);

  const [isPublished, setIsPublished] = useState(Boolean(product.is_published ?? true));
  const [featured, setFeatured] = useState(Boolean(product.is_featured ?? false));
  const [trending, setTrending] = useState(Boolean(product.is_trending ?? false));

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  const [brandOpen, setBrandOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setBrandOpen(false);
      if (genderRef.current && !genderRef.current.contains(e.target as Node)) setGenderOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function toggleSizeEnabled(s: string) {
    setSizeRows(prev => prev.map(r => r.size === s
      ? { ...r, enabled: !r.enabled, stock: !r.enabled && r.stock === 0 ? 1 : r.stock }
      : r));
  }
  function updateStock(s: string, stock: number) {
    setSizeRows(prev => prev.map(r => r.size === s ? { ...r, stock } : r));
  }
  function setAllZero() { setSizeRows(prev => prev.map(r => ({ ...r, stock: 0 }))); }
  function enableAll() { setSizeRows(prev => prev.map(r => ({ ...r, enabled: true }))); }

  const margin = Number(cost) > 0 && Number(full) > 0
    ? ((Number(full) - Number(cost)) / Number(full)) * 100
    : null;

  function copyId() {
    navigator.clipboard.writeText(product.id).then(() => toast.success("Product ID copied"));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !brand || !full) { setError("Name, brand and full payment price are required."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("product", JSON.stringify({
        slug,
        name, brand,
        colorway: colorway || null, gender,
        sku: sku || null, description: description || null,
        srp_price: Number(srp) || Number(full),
        downpayment_price: Number(dp) || Math.round(Number(full) * 0.5),
        full_payment_price: Number(full),
        cost_price: cost ? Number(cost) : null,
        status,
        eta_start: status === "pre-order" && etaStart ? etaStart : null,
        eta_end: status === "pre-order" && etaEnd ? etaEnd : null,
        is_published: isPublished, is_featured: featured,
        is_trending: trending,
        images: imageUrls,
      }));
      fd.append("sizes", JSON.stringify(
        sizeRows.filter(r => r.enabled).map(r => ({ size: r.size, stock: r.stock }))
      ));

      const res = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", body: fd });
      const result = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) { setError(result.error ?? "Failed to save"); setSaving(false); return; }

      toast.success("Product updated");
      router.push("/admin/products");
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirmDialog({
      title: `Delete "${name}"?`,
      description: "This cannot be undone.",
      confirmLabel: "Delete product",
      variant: "destructive",
    });
    if (!ok) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Product deleted");
      router.push("/admin/products");
    } else {
      toast.error("Failed to delete product");
      setDeleting(false);
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast";
  const labelCls = "block text-admin-eyebrow text-ink-3 mb-1.5";

  return (
    <div className="pb-24 lg:pb-0">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products"
          className="p-2 rounded-md text-ink-3 hover:text-ink hover:bg-admin-row-hover transition-colors duration-admin-fast">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Edit product</h1>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 text-admin-sm font-medium rounded-md bg-state-error/10 text-state-error border border-state-error/30">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Basics */}
            <div className="bg-paper border border-line rounded-md p-5">
              <p className="text-admin-title text-ink mb-4">Basics</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Name *</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Slug</label>
                  <input value={slug} onChange={e => setSlug(e.target.value)} className={`${inputCls} font-mono text-admin-sm`} />
                </div>
                <div>
                  <label className={labelCls}>Brand *</label>
                  <div className="relative" ref={brandRef}>
                    <button type="button" onClick={() => setBrandOpen(o => !o)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-left hover:border-line-strong transition-colors duration-admin-fast">
                      <span className={brand ? "text-ink" : "text-ink-3"}>{brand || "Select brand…"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-admin-fast ${brandOpen ? "rotate-180" : ""}`} />
                    </button>
                    {brandOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto bg-paper border border-line rounded-md shadow-lg overflow-hidden">
                        {BRANDS.map(b => (
                          <button key={b} type="button" onClick={() => { setBrand(b); setBrandOpen(false); }}
                            className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-admin-sm text-left hover:bg-admin-row-hover transition-colors duration-admin-fast ${brand === b ? "text-ink font-semibold" : "text-ink-2"}`}>
                            {b}
                            {brand === b && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <div className="relative" ref={genderRef}>
                    <button type="button" onClick={() => setGenderOpen(o => !o)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-left hover:border-line-strong transition-colors duration-admin-fast">
                      <span className="text-ink">{gender}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-admin-fast ${genderOpen ? "rotate-180" : ""}`} />
                    </button>
                    {genderOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-paper border border-line rounded-md shadow-lg overflow-hidden">
                        {GENDERS.map(g => (
                          <button key={g} type="button" onClick={() => { setGender(g); setGenderOpen(false); }}
                            className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-admin-sm text-left hover:bg-admin-row-hover transition-colors duration-admin-fast ${gender === g ? "text-ink font-semibold" : "text-ink-2"}`}>
                            {g}
                            {gender === g && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Colorway</label>
                  <input value={colorway} onChange={e => setColorway(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>SKU</label>
                  <input value={sku} onChange={e => setSku(e.target.value)} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                    className={`${inputCls} resize-none`} />
                </div>
              </div>

              {/* Availability */}
              <div className="mt-5 pt-5 border-t border-line">
                <p className={labelCls}>Availability</p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {([
                    { value: "on-hand" as const, label: "On Hand", desc: "Available for immediate shipping" },
                    { value: "pre-order" as const, label: "Pre-Order", desc: "Reserve now, ships later" },
                  ]).map(opt => (
                    <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                      className={`p-3.5 text-left rounded-md border transition-colors duration-admin-fast ${
                        status === opt.value ? "border-ink bg-admin-row-hover" : "border-line hover:border-line-strong"
                      }`}>
                      <p className="text-admin-sm font-semibold text-ink">{opt.label}</p>
                      <p className="text-admin-micro text-ink-3 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {status === "pre-order" && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className={labelCls}>ETA start</label>
                      <input type="date" value={etaStart} onChange={e => setEtaStart(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>ETA end</label>
                      <input type="date" value={etaEnd} onChange={e => setEtaEnd(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-paper border border-line rounded-md p-5">
              <p className="text-admin-title text-ink mb-4">Pricing</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "SRP", value: srp, set: setSrp },
                  { label: "DP Plan Total", value: dp, set: setDp },
                  { label: "Full Payment Price *", value: full, set: setFull },
                ].map(f => (
                  <div key={f.label}>
                    <label className={labelCls}>{f.label}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-sm text-ink-3">₱</span>
                      <input type="number" min="0" value={f.value} onChange={e => f.set(e.target.value)}
                        className={`${inputCls} pl-7`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-line">
                <label className={labelCls}>Cost price (internal)</label>
                <div className="relative max-w-[180px]">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-sm text-ink-3">₱</span>
                  <input type="number" min="0" value={cost} onChange={e => setCost(e.target.value)}
                    className={`${inputCls} pl-7`} />
                </div>
                {margin !== null && (
                  <p className={`mt-2.5 text-admin-sm font-medium ${margin >= 0 ? "text-state-onhand" : "text-state-error"}`}>
                    Margin: {margin.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            {/* Sizes & Stock */}
            <div className="bg-paper border border-line rounded-md p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <p className="text-admin-title text-ink">Sizes & stock</p>
                <div className="flex gap-2">
                  <button type="button" onClick={setAllZero}
                    className="px-2.5 py-1.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                    Set all to 0
                  </button>
                  <button type="button" onClick={enableAll}
                    className="px-2.5 py-1.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                    Enable all
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {sizeRows.map(r => (
                  <div key={r.size}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border transition-colors duration-admin-fast ${
                      r.enabled ? "border-line-strong" : "border-line"
                    }`}>
                    <span className={`text-admin-sm font-medium w-14 shrink-0 ${r.enabled ? "text-ink" : "text-ink-3"}`}>{r.size}</span>
                    <input type="number" min="0" value={r.stock} disabled={!r.enabled}
                      onChange={e => updateStock(r.size, Number(e.target.value))}
                      className="w-16 px-2 py-1.5 text-admin-sm text-center bg-paper border border-line rounded text-ink focus:outline-none focus:border-line-strong disabled:opacity-40 transition-colors duration-admin-fast" />
                    <div className="ml-auto">
                      <Toggle checked={r.enabled} onChange={() => toggleSizeEnabled(r.size)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="bg-paper border border-line rounded-md p-5">
              <p className="text-admin-title text-ink mb-4">Images</p>
              <ImageUploader initialUrls={initialImages} onChange={setImageUrls} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <div className="bg-paper border border-line rounded-md p-5">
              <p className="text-admin-eyebrow text-ink-3">Publish status</p>
              <div className="flex gap-2 mt-2.5">
                {(["draft", "published"] as const).map(opt => {
                  const active = (opt === "published") === isPublished;
                  return (
                    <button key={opt} type="button" onClick={() => setIsPublished(opt === "published")}
                      className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-md border text-admin-sm font-medium capitalize transition-colors duration-admin-fast ${
                        active ? "border-ink bg-admin-row-hover text-ink" : "border-line text-ink-2 hover:border-line-strong"
                      }`}>
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-ink" : "border-line-strong"}`}>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-ink" />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <p className="text-admin-eyebrow text-ink-3 mt-6">Visibility flags</p>
              <div className="mt-2.5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-admin-sm font-medium text-ink">Featured</p>
                    <p className="text-admin-micro text-ink-3 mt-0.5">Shows on homepage hero-adjacent</p>
                  </div>
                  <Toggle checked={featured} onChange={setFeatured} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-admin-sm font-medium text-ink">Trending</p>
                    <p className="text-admin-micro text-ink-3 mt-0.5">Shows in &ldquo;What&rsquo;s moving&rdquo; section</p>
                  </div>
                  <Toggle checked={trending} onChange={setTrending} />
                </div>
              </div>

              <div className="hidden lg:flex flex-col gap-2 mt-6">
                <button type="submit" disabled={saving}
                  className="w-full py-2.5 text-admin font-medium rounded-md bg-ink text-paper hover:bg-ink-2 disabled:opacity-50 transition-colors duration-admin-fast">
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <Link href="/admin/products"
                  className="w-full text-center py-2.5 text-admin font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                  Cancel
                </Link>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-admin font-medium rounded-md border border-state-error/30 text-state-error hover:bg-state-error/10 disabled:opacity-50 transition-colors duration-admin-fast">
                  <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Deleting…" : "Delete product"}
                </button>
              </div>
            </div>

            <div className="bg-paper border border-line rounded-md p-5">
              <p className="text-admin-eyebrow text-ink-3 mb-3">Metadata</p>
              <div className="space-y-3">
                <div>
                  <p className="text-admin-micro text-ink-3">Created</p>
                  <p className="text-admin-sm text-ink mt-0.5">
                    {product.created_at ? new Date(product.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-admin-micro text-ink-3">Last updated</p>
                  <p className="text-admin-sm text-ink mt-0.5">
                    {product.updated_at ? new Date(product.updated_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-admin-micro text-ink-3">Product ID</p>
                  <button type="button" onClick={copyId}
                    className="flex items-center gap-1.5 text-admin-sm text-ink mt-0.5 font-mono hover:text-ink-2 transition-colors duration-admin-fast">
                    <span className="truncate max-w-[160px]">{product.id}</span>
                    <Copy className="w-3 h-3 shrink-0 text-ink-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sticky save bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper border-t border-line p-3 flex gap-2">
          <Link href="/admin/products"
            className="flex-1 text-center py-2.5 text-admin font-medium rounded-md border border-line text-ink-2">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 text-admin font-medium rounded-md bg-ink text-paper disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
      {dialog}
    </div>
  );
}
