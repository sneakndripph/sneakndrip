"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import Link from "next/link";
import { BRANDS, SNEAKER_SIZES, SIZE_GRIDS, CATEGORIES, ONE_SIZE } from "@/lib/constants";
import { now } from "@/lib/utils";
import ProductCard, { isSoldOut } from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/ui/ProductCardSkeleton";
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import SearchAutocomplete from "@/components/search/SearchAutocomplete";
import { FUSE_OPTIONS } from "@/hooks/useProductSearch";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 24;

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
  initialCategory = "",
}: {
  products: Product[];
  initialSearch?: string;
  initialFilter?: string;
  initialBrand?: string;
  initialGender?: string;
  /** "" = all categories. The page remounts this component when it changes. */
  initialCategory?: string;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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
    queueMicrotask(() => {
      setAvailability(mapFilter(initialFilter));
      setShowNewOnly(initialFilter === "new");
    });
  }, [initialFilter]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { queueMicrotask(() => setSearch(initialSearch)); }, [initialSearch]);

  useEffect(() => {
    queueMicrotask(() => setSelectedBrands(initialBrand ? [initialBrand] : []));
  }, [initialBrand]);

  useEffect(() => {
    queueMicrotask(() => setSelectedGenders(initialGender ? [initialGender] : []));
  }, [initialGender]);

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

  function handleQueryChange(v: string) {
    setSearch(v);
    const params = new URLSearchParams();
    if (initialCategory) params.set("category", initialCategory);
    if (v) params.set("q", v);
    const qs = params.toString();
    router.replace(`/shop${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const scoped = useMemo(
    () => initialCategory ? products.filter(p => (p.category ?? "sneakers") === initialCategory) : products,
    [products, initialCategory],
  );
  const isSneakerScope = !initialCategory || initialCategory === "sneakers";
  // Sneakers keep the curated brand list and US size grid; bags/accessories show what is in stock.
  const brandOptions = useMemo(() => {
    const present = [...new Set(scoped.map(p => p.brand))].sort();
    return isSneakerScope ? [...new Set([...BRANDS, ...present])] : present;
  }, [scoped, isSneakerScope]);
  // All/Sneakers use the US grid, Apparel XS–XXL; bags/accessories list whatever sizes are stocked.
  const sizeGrid = initialCategory ? SIZE_GRIDS[initialCategory as keyof typeof SIZE_GRIDS] : SNEAKER_SIZES;
  const sizeOptions = useMemo(
    () => sizeGrid ?? [...new Set(scoped.flatMap(p => p.sizes.map(s => s.size)))].filter(s => s !== ONE_SIZE),
    [scoped, sizeGrid],
  );
  const categoryLabel = CATEGORIES.find(c => c.value === initialCategory)?.label;

  const fuse = useMemo(() => new Fuse(scoped, FUSE_OPTIONS), [scoped]);

  const filtered = useMemo(() => {
    let list = [...scoped];
    if (search) {
      const matchedIds = new Set(fuse.search(search).map(r => r.item.id));
      list = list.filter(p => matchedIds.has(p.id));
    }
    if (selectedBrands.length) list = list.filter(p => selectedBrands.includes(p.brand));
    if (selectedGenders.length) list = list.filter(p => selectedGenders.map(g => g.toLowerCase()).includes((p.gender ?? "").toLowerCase()));
    if (selectedSizes.length) list = list.filter(p => p.sizes.some(s => selectedSizes.includes(s.size) && s.stock > 0));
    if (availability !== "all") list = list.filter(p => p.status === availability);
    if (showNewOnly) {
      const cutoff = now() - 30 * 24 * 60 * 60 * 1000;
      const recent = list.filter(p => new Date(p.created_at ?? 0).getTime() >= cutoff);
      if (recent.length > 0) {
        list = recent;
      } else {
        // Fallback: when nothing was added in the last 30 days, show the 12 most
        // recently added products from whatever is still in the list after the
        // other filters (brand, gender, size, availability) have been applied.
        list = [...list]
          .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
          .slice(0, 12);
      }
    }
    list = list.filter(p => p.full_payment_price <= maxPrice);
    if (sort === "price-asc") list.sort((a, b) => a.full_payment_price - b.full_payment_price);
    if (sort === "price-desc") list.sort((a, b) => b.full_payment_price - a.full_payment_price);
    if (sort === "newest") list.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
    // Sold out always last; on Featured, on-hand pairs also come before pre-orders. Sort is stable.
    const rank = (p: Product) => isSoldOut(p) ? 2 : sort === "featured" && p.status !== "on-hand" ? 1 : 0;
    list.sort((a, b) => rank(a) - rank(b));
    return list;
  }, [scoped, fuse, search, selectedBrands, selectedGenders, selectedSizes, availability, showNewOnly, maxPrice, sort]);

  // Infinite scroll windowing — filters/sort operate on the full in-memory
  // list above; this only controls how much of that result is rendered.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    queueMicrotask(() => setVisibleCount(PAGE_SIZE));
  }, [search, selectedBrands, selectedGenders, selectedSizes, availability, showNewOnly, maxPrice, sort]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    let cancelled = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
      setTimeout(() => {
        if (cancelled) return;
        setVisibleCount(c => Math.min(c + PAGE_SIZE, filtered.length));
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }, 400);
    }, { rootMargin: "480px 0px" });
    observer.observe(el);
    return () => { cancelled = true; observer.disconnect(); };
  }, [hasMore, filtered.length, visibleCount]);

  const activeFilters = selectedBrands.length + selectedSizes.length + selectedGenders.length + (availability !== "all" ? 1 : 0) + (showNewOnly ? 1 : 0);

  function clearFilters() {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedGenders([]);
    setAvailability("all");
    setShowNewOnly(false);
    setMaxPrice(20000);
  }

  const filtersContent = (
    <div className="space-y-7">
      {brandOptions.length > 0 && <div>
        <p className="text-eyebrow text-ink-3 mb-3">Brand</p>
        <div className="flex flex-wrap gap-1.5">
          {brandOptions.map(b => (
            <button key={b} onClick={() => setSelectedBrands(arr => toggleArr(arr, b))}
              className={`text-micro px-3 py-1.5 rounded-sm border transition-colors ${
                selectedBrands.includes(b) ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink"
              }`}>{b}</button>
          ))}
        </div>
      </div>}
      <div>
        <p className="text-eyebrow text-ink-3 mb-3">Gender</p>
        <div className="flex flex-wrap gap-1.5">
          {GENDERS.map(g => (
            <button key={g} onClick={() => setSelectedGenders(arr => toggleArr(arr, g))}
              className={`text-micro px-3 py-1.5 rounded-sm border transition-colors ${
                selectedGenders.includes(g) ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink"
              }`}>{g}</button>
          ))}
        </div>
      </div>
      {sizeOptions.length > 0 && <div>
        <p className="text-eyebrow text-ink-3 mb-3">Size</p>
        <div className="flex flex-wrap gap-1.5">
          {sizeOptions.map(s => (
            <button key={s} onClick={() => setSelectedSizes(arr => toggleArr(arr, s))}
              className={`text-micro px-2.5 py-1.5 rounded-sm border transition-colors ${
                selectedSizes.includes(s) ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink"
              }`}>{s}</button>
          ))}
        </div>
      </div>}
      <div>
        <p className="text-eyebrow text-ink-3 mb-3">Availability</p>
        <div className="flex flex-col gap-2">
          {[["all", "All"], ["on-hand", "On Hand"], ["pre-order", "Pre-Order"]].map(([v, l]) => (
            <button key={v} onClick={() => setAvailability(v)}
              className={`text-body-sm px-3 py-2 text-left rounded-md border transition-colors ${
                availability === v ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink"
              }`}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-eyebrow text-ink-3 mb-3">
          Max price <span className="text-ink">₱{maxPrice.toLocaleString()}</span>
        </p>
        <input type="range" min={1000} max={25000} step={500} value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full accent-ink" />
        <div className="flex justify-between mt-1">
          <span className="text-micro text-ink-3">₱1,000</span>
          <span className="text-micro text-ink-3">₱25,000</span>
        </div>
      </div>
      {activeFilters > 0 && (
        <button onClick={clearFilters}
          className="text-micro text-state-error flex items-center gap-1 pt-1">
          <X className="w-3 h-3" /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-paper min-h-screen">
      <div className="py-10 pb-6 border-b border-line">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12">
          <p className="text-eyebrow text-ink-3 mb-2">Catalog</p>
          <h1 className="text-display-s md:text-display text-ink font-display font-medium leading-tight">{categoryLabel ?? "Shop all"}</h1>
          <nav aria-label="Categories" className="flex gap-2 mt-5 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
            {[{ value: "", label: "All" }, ...CATEGORIES].map(c => (
              <Link key={c.value} href={c.value ? `/shop?category=${c.value}` : "/shop"} scroll={false}
                aria-current={initialCategory === c.value ? "page" : undefined}
                className={`shrink-0 text-body-sm px-4 py-2 rounded-full border transition-colors ${
                  initialCategory === c.value ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink"
                }`}>
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-8">
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10 lg:items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            {filtersContent}
          </aside>

          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <SearchAutocomplete
                initialValue={initialSearch}
                onQueryChange={handleQueryChange}
                className="flex-1 min-w-[200px]"
              />
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setSortOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 text-body-sm text-ink border border-line rounded-md min-w-[170px] justify-between hover:border-ink transition-colors">
                  <span>{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform text-ink-3 ${sortOpen ? "rotate-180" : "rotate-0"}`} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[170px] overflow-hidden rounded-md shadow-lg bg-paper border border-line">
                    {SORT_OPTIONS.map(o => (
                      <button key={o.value}
                        onClick={() => { setSort(o.value); setSortOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-body-sm text-left transition-colors hover:bg-paper-2 ${
                          sort === o.value ? "text-ink font-medium bg-paper-2" : "text-ink-2"
                        }`}>
                        {o.label}
                        {sort === o.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="text-micro text-ink-3 mb-5">
              Showing {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </p>

            {filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                  {visibleProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                {loadingMore && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mt-4 lg:mt-6">
                    {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                  </div>
                )}
                {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}
                {!hasMore && filtered.length > PAGE_SIZE && (
                  <p className="text-center text-micro text-ink-3 py-8">You&apos;ve reached the end</p>
                )}
              </>
            ) : (
              <div className="text-center py-24">
                {scoped.length === 0 ? (
                  <>
                    <p className="text-body text-ink-2">No {categoryLabel?.toLowerCase() ?? "products"} yet. Coming soon.</p>
                    <Link href="/shop" className="mt-3 inline-block text-body-sm text-ink underline hover:opacity-60 transition-opacity">Browse everything</Link>
                  </>
                ) : (
                  <>
                    <p className="text-body text-ink-2">No matches. Try clearing filters.</p>
                    <button onClick={clearFilters} className="mt-3 text-body-sm text-ink underline hover:opacity-60 transition-opacity">
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile floating filters button + bottom sheet, portaled to document.body to
          escape the transform containing block created by RouteTransition's motion.main */}
      {mounted && createPortal(
        <>
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden fixed bottom-6 left-6 z-30 flex items-center gap-2 px-5 py-3 rounded-full bg-ink text-paper shadow-xl"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {activeFilters > 0 && `(${activeFilters})`}
          </button>

          {filtersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-ink/50" onClick={() => setFiltersOpen(false)} />
              <div className="fixed inset-x-0 bottom-0 bg-paper rounded-t-xl p-6 pb-8 shadow-xl max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
                <div className="flex items-center justify-between mb-5">
                  <p className="text-body font-display font-medium text-ink">Filters</p>
                  <button onClick={() => setFiltersOpen(false)} className="text-ink-3 hover:text-ink transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {filtersContent}
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="w-full mt-6 py-3.5 rounded-md text-body-sm font-medium bg-ink text-paper hover:bg-ink-2 transition-colors"
                >
                  Show {filtered.length} results
                </button>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}
