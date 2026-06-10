"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND, FONTS } from "@/lib/constants";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";

type Row = Record<string, unknown> & { product_sizes?: { size: string; stock: number }[] };

export default function AdminProductsClient({ initialProducts }: { initialProducts: Row[] }) {
  const [products, setProducts] = useState<Row[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = products.filter(p => {
    const matchSearch = !search || String(p.name).toLowerCase().includes(search.toLowerCase()) || String(p.brand).toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Inventory</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>PRODUCTS</h1>
        </div>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 px-5 py-3 font-bold text-sm uppercase tracking-wide transition-opacity hover:opacity-80"
          style={{ background: BRAND.black, color: BRAND.bg }}>
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full pl-10 pr-4 py-3 text-sm focus:outline-none"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
        </div>
        <div className="flex gap-2">
          {[["all","All"], ["on-hand","On Hand"], ["pre-order","Pre-Order"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className="px-4 py-3 text-sm font-semibold transition-all"
              style={{ background: filter === v ? BRAND.teal : BRAND.card, color: filter === v ? "#fff" : BRAND.muted, border: `1px solid ${filter === v ? BRAND.teal : BRAND.border}` }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted }}>NO PRODUCTS</p>
            <p className="text-sm mt-2 mb-5" style={{ color: BRAND.mutedLight }}>Add your first product to get started.</p>
            <Link href="/admin/products/new" className="px-6 py-3 font-bold text-sm uppercase tracking-wider inline-block"
              style={{ background: BRAND.black, color: BRAND.bg }}>Add Product</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BRAND.border}`, background: "rgba(13,13,13,0.02)" }}>
                  {["Product","Brand","Status","SRP","Sale Price","Sizes","Actions"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const sizes = (p.product_sizes ?? []) as { size: string; stock: number }[];
                  const inStock = sizes.filter(s => s.stock > 0).length;
                  return (
                    <tr key={String(p.id)} className="transition-colors hover:bg-black/[0.01]"
                      style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ background: String(p.bg || BRAND.bg), border: `1px solid ${BRAND.border}` }}>
                            {Array.isArray(p.images) && p.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={String(p.images[0])} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span style={{ fontFamily: FONTS.display, fontSize: "0.8rem", color: BRAND.black, opacity: 0.15 }}>
                                {String(p.brand ?? "?").charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-snug" style={{ color: BRAND.black }}>{String(p.name)}</p>
                            {p.colorway ? <p className="text-xs" style={{ color: BRAND.muted }}>{String(p.colorway)}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium" style={{ color: BRAND.muted }}>{String(p.brand)}</td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1"
                          style={{ background: p.status === "on-hand" ? `${BRAND.teal}15` : `${BRAND.red}12`, color: p.status === "on-hand" ? BRAND.teal : BRAND.red }}>
                          {p.status === "on-hand" ? "On Hand" : "Pre-Order"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: BRAND.muted }}>₱{Number(p.srp_price).toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm font-bold" style={{ color: BRAND.black }}>₱{Number(p.full_payment_price).toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm" style={{ color: BRAND.muted }}>{inStock}/{sizes.length}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/shop/${String(p.slug)}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                            style={{ background: "rgba(13,13,13,0.05)", color: BRAND.muted }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/admin/products/${String(p.id)}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                            style={{ background: `${BRAND.teal}12`, color: BRAND.teal }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => handleDelete(String(p.id))}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                            style={{ background: `${BRAND.red}10`, color: BRAND.red }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
