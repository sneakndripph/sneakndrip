"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search as SearchIcon, X } from "lucide-react";
import { useProductSearch } from "@/hooks/useProductSearch";
import type { Product } from "@/lib/types";

const DEBOUNCE_MS = 150;
const MAX_DROPDOWN_RESULTS = 5;

const focusRing = "focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2";

type SearchAutocompleteProps = {
  autoFocus?: boolean;
  placeholder?: string;
  /** Fired after a result is chosen (product click, "view all", or submit) so a parent overlay/dropdown can close itself. */
  onNavigate?: () => void;
  className?: string;
  /** Pre-fills the input, e.g. from a shareable /shop?q= URL. */
  initialValue?: string;
  /** Fired with the debounced query on every change, so a parent (like /shop) can drive its own real-time filtering in sync with this input. */
  onQueryChange?: (value: string) => void;
};

export default function SearchAutocomplete({
  autoFocus = false,
  placeholder = "Search sneakers, brands…",
  onNavigate,
  className = "",
  initialValue = "",
  onQueryChange,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const listboxId = useId();
  const [inputValue, setInputValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { query, results, isLoading, hasNoResults, popular, recent, search, clear } = useProductSearch();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);
    setActiveIndex(-1);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { search(v); onQueryChange?.(v); }, DEBOUNCE_MS);
  }

  const visibleResults = results.slice(0, MAX_DROPDOWN_RESULTS);
  const hasMore = results.length > MAX_DROPDOWN_RESULTS;

  const goToProduct = useCallback((slug: string) => {
    setOpen(false);
    setInputValue("");
    clear();
    onNavigate?.();
    router.push(`/shop/${slug}`);
  }, [router, clear, onNavigate]);

  const viewAll = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }, [query, router, onNavigate]);

  function handleClear() {
    setInputValue("");
    clear();
    setActiveIndex(-1);
    onQueryChange?.("");
    inputRef.current?.focus();
  }

  // Keyboard nav covers matched results + the "view all" row. The no-results
  // recommendation grid is plain links, not part of this roving index.
  const navCount = visibleResults.length + (hasMore ? 1 : 0);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || navCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % navCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => (i <= 0 ? navCount - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex === -1) return;
      e.preventDefault();
      if (activeIndex < visibleResults.length) goToProduct(visibleResults[activeIndex].slug);
      else viewAll();
    }
  }

  const showDropdown = open && inputValue.trim().length > 0;

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        aria-label="Search sneakers and brands"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => { if (inputValue.trim()) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full pl-10 pr-9 py-2.5 md:py-3 text-body-sm bg-paper-2 border border-line rounded-sm text-ink placeholder:text-ink-3 focus:outline-none ${focusRing}`}
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors ${focusRing}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute top-full left-0 right-0 mt-1 z-[60] overflow-hidden rounded-md bg-paper border border-line shadow-[var(--shadow-lg)] max-h-[70vh] overflow-y-auto"
        >
          {isLoading && results.length === 0 && !hasNoResults && (
            <p className="px-4 py-3.5 text-body-sm text-ink-3">Loading…</p>
          )}

          {!isLoading && hasNoResults && (
            <div className="py-2">
              <p className="px-4 py-2 text-body-sm text-ink-3">
                No results for &ldquo;{query}&rdquo;
              </p>
              {popular.length > 0 && (
                <RecommendationSection title="Popular" products={popular} onSelect={goToProduct} />
              )}
              {recent.length > 0 && (
                <RecommendationSection title="Recently added" products={recent} onSelect={goToProduct} />
              )}
            </div>
          )}

          {!hasNoResults && visibleResults.length > 0 && (
            <>
              {visibleResults.map((p, i) => (
                <button
                  key={p.id}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  onClick={() => goToProduct(p.slug)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-line ${
                    activeIndex === i ? "bg-paper-2" : "hover:bg-paper-2"
                  }`}
                >
                  <div className="w-10 h-10 shrink-0 overflow-hidden relative rounded-sm bg-paper-2">
                    {p.images?.[0] && (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium truncate text-ink">{p.name}</p>
                    <p className="text-micro text-ink-3">
                      {p.brand} · ₱{p.full_payment_price.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
              {hasMore && (
                <button
                  id={`${listboxId}-opt-${visibleResults.length}`}
                  role="option"
                  aria-selected={activeIndex === visibleResults.length}
                  onClick={viewAll}
                  className={`w-full text-body-sm font-medium px-4 py-3 text-center text-ink transition-colors ${
                    activeIndex === visibleResults.length ? "bg-paper-2" : "hover:bg-paper-2"
                  }`}
                >
                  View all {results.length} results →
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationSection({
  title,
  products,
  onSelect,
}: {
  title: string;
  products: Product[];
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="px-4 py-2">
      <p className="text-eyebrow text-ink-3 mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {products.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p.slug)}
            className="flex items-center gap-2 p-1.5 rounded-sm hover:bg-paper-2 transition-colors text-left"
          >
            <div className="w-9 h-9 shrink-0 overflow-hidden relative rounded-sm bg-paper-2">
              {p.images?.[0] && (
                <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="36px" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-micro font-medium truncate text-ink">{p.name}</p>
              <p className="text-micro text-ink-3 truncate">{p.brand}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
