"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BRANDS, SNEAKER_SIZES } from "@/lib/constants";
import ProductCard from "@/components/product/ProductCard";
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import type { Product } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
];

function mapFilter(filter: string): string {
  if (filter === "pre-order" || filter === "on-hand") return filter;
  return "all";
}

const GENDERS = ["Men", "Women", "Unisex", "Kids"];

export default function ShopClient({
  products,
  initialSearch = "",
  initialFilter = "all",
  initialBrand = "",
  initialGender = "",
}: {
  products: Product[];
  initialSearch?: string;
  initialFilter?: string;
  initialBrand?: string;
  initialGender?: string;
}) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState("featured");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [selectedGenders, setSelectedGenders] = useState<string[]>(initialGender ? [initialGender] : []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>(mapFilter(initialFilter));
  const [showNewOnly, setShowNewOnly] = useState(initialFilter === "new");
  const [maxPrice, setMaxPrice] = useState(20000);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Sync filter + search state when URL params change
  useEffect(() => {
    setAvailability(mapFilter(initialFilter));
    setShowNewOnly(initialFilter === "new");
  }, [initialFilter]);

  useEffect(() => { setSearch(initialSearch); }, [initialSearch]);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const toggleArr = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
    if (selectedBrands.length) list = list.filter(p => selectedBrands.includes(p.brand));
    if (selectedGenders.length) list = list.filter(p => selectedGenders.map(g => g.toLowerCase()).includes((p.gender ?? "").toLowerCase()));
    if (selectedSizes.length) list = list.filter(p => p.sizes.some(s => selectedSizes.includes(s.size) && s.stock > 0));
    if (availability !== "all") list = list.filter(p => p.status === availability);
    if (showNewOnly) {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      list = list.filter(p => new Date(p.created_at ?? 0).getTime() >= cutoff);
    }
    list = list.filter(p => p.full_payment_price <= maxPrice);
    if (sort === "price-asc") list.sort((a, b) => a.full_payment_price - b.full_payment_price);
    if (sort === "price-desc") list.sort((a, b) => b.full_payment_price - a.full_payment_price);
    if (sort === "newest") list.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
    return list;
  }, [products, search, selectedBrands, selectedSizes, availability, showNewOnly, maxPrice, sort]);

  const activeFilters = selectedBrands.length + selectedSizes.length + selectedGenders.length + (availability !== "all" ? 1 : 0) + (showNewOnly ? 1 : 0);

  return (
    <div className="bg-snd-bg min-h-screen font-body">
      <div className="py-12 pb-8 border-b border-snd-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="snd-label mb-3 text-snd-muted-lt">Catalog</p>
              <h1 className="font-heading tracking-[0.04em] leading-none text-snd-black text-[length:var(--text-display-md)]">
                ALL SNEAKERS
              </h1>
            </div>
            <p className="snd-label pb-1 text-snd-muted-lt">
              {filtered.length} available
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <input value={search} onChange={e => {
              const v = e.target.value;
              setSearch(v);
              const params = new URLSearchParams();
              if (v) params.set("q", v);
              router.replace(`/shop${v ? `?${params.toString()}` : ""}`, { scroll: false });
            }}
              placeholder="Search sneakers, brands…"
              className="w-full px-4 py-3 pr-10 text-sm focus:outline-none bg-snd-card border border-snd-border text-snd-black" />
            {search && (
              <button onClick={() => {
                setSearch("");
                router.replace("/shop", { scroll: false });
              }} className="absolute right-3 top-1/2 -translate-y-1/2 text-snd-muted">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border ${
              activeFilters > 0 ? "bg-snd-teal text-white border-snd-teal" : "bg-snd-card text-snd-black border-snd-border"
            }`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters {activeFilters > 0 && `(${activeFilters})`}
          </button>
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold min-w-[170px] justify-between bg-snd-card border text-snd-black ${sortOpen ? "border-snd-teal" : "border-snd-border"}`}>
              <span>{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform text-snd-muted ${sortOpen ? "rotate-180" : "rotate-0"}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[170px] overflow-hidden shadow-lg bg-snd-card border border-snd-border">
                {SORT_OPTIONS.map(o => (
                  <button key={o.value}
                    onClick={() => { setSort(o.value); setSortOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:opacity-80 border-b border-snd-border ${
                      sort === o.value ? "bg-snd-teal/[6%] text-snd-teal font-bold" : "bg-transparent text-snd-black font-medium"
                    }`}>
                    {o.label}
                    {sort === o.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div className="p-6 mb-8 bg-snd-card border border-snd-border">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3 text-snd-black">Brand</p>
                <div className="flex flex-wrap gap-1.5">
                  {BRANDS.map(b => (
                    <button key={b} onClick={() => setSelectedBrands(arr => toggleArr(arr, b))}
                      className={`text-xs font-semibold px-3 py-1.5 transition-all border ${
                        selectedBrands.includes(b) ? "bg-snd-teal text-white border-snd-teal" : "bg-transparent text-snd-muted border-snd-border"
                      }`}>{b}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3 text-snd-black">Gender</p>
                <div className="flex flex-wrap gap-1.5">
                  {GENDERS.map(g => (
                    <button key={g} onClick={() => setSelectedGenders(arr => toggleArr(arr, g))}
                      className={`text-xs font-semibold px-3 py-1.5 transition-all border ${
                        selectedGenders.includes(g) ? "bg-snd-teal text-white border-snd-teal" : "bg-transparent text-snd-muted border-snd-border"
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3 text-snd-black">Size</p>
                <div className="flex flex-wrap gap-1.5">
                  {SNEAKER_SIZES.map(s => (
                    <button key={s} onClick={() => setSelectedSizes(arr => toggleArr(arr, s))}
                      className={`text-xs font-semibold px-2.5 py-1.5 transition-all border ${
                        selectedSizes.includes(s) ? "bg-snd-teal text-white border-snd-teal" : "bg-transparent text-snd-muted border-snd-border"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3 text-snd-black">Availability</p>
                <div className="flex flex-col gap-2">
                  {[["all", "All"], ["on-hand", "On Hand"], ["pre-order", "Pre-Order"]].map(([v, l]) => (
                    <button key={v} onClick={() => setAvailability(v)}
                      className={`text-xs font-semibold px-3 py-2 text-left transition-all border ${
                        availability === v ? "bg-snd-teal text-white border-snd-teal" : "bg-transparent text-snd-muted border-snd-border"
                      }`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3 text-snd-black">
                  Max Price: <span className="text-snd-teal">₱{maxPrice.toLocaleString()}</span>
                </p>
                <input type="range" min={1000} max={25000} step={500} value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-snd-teal" />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-snd-muted">₱1,000</span>
                  <span className="text-xs text-snd-muted">₱25,000</span>
                </div>
              </div>
            </div>
            {activeFilters > 0 && (
              <div className="mt-5 pt-4 border-t border-snd-border">
                <button onClick={() => { setSelectedBrands([]); setSelectedSizes([]); setSelectedGenders([]); setAvailability("all"); setShowNewOnly(false); setMaxPrice(20000); }}
                  className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-snd-red">
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-heading tracking-[0.04em] text-[2rem] text-snd-muted">NO RESULTS</p>
            <p className="text-sm mt-2 text-snd-muted-lt">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
