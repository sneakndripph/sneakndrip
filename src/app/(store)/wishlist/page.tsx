"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import LoadingMonogram from "@/components/ui/LoadingMonogram";
import type { Product } from "@/lib/types";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login?redirect=/wishlist"); return; }
      queueMicrotask(() => setAuthChecked(true));
    });
  }, [router]);

  useEffect(() => {
    if (!authChecked || wishlistLoading) return;
    if (wishlist.length === 0) {
      queueMicrotask(() => { setProducts([]); setProductsLoading(false); });
      return;
    }
    queueMicrotask(() => setProductsLoading(true));
    fetch(`/api/wishlist/products?ids=${wishlist.join(",")}`)
      .then(r => r.ok ? r.json() : { products: [] })
      .then(d => queueMicrotask(() => { setProducts(d.products ?? []); setProductsLoading(false); }))
      .catch(() => queueMicrotask(() => { setProducts([]); setProductsLoading(false); }));
  }, [wishlist, wishlistLoading, authChecked]);

  const loading = !authChecked || wishlistLoading || productsLoading;
  const showLoading = useMinimumLoadingTime(loading, 800);
  const visibleProducts = products.filter(p => wishlist.includes(p.id));

  if (showLoading) {
    return (
      <div className="bg-paper min-h-screen font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen flex items-center justify-center">
          <LoadingMonogram />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-screen font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <p className="text-eyebrow text-ink-3 mb-2">My Collection</p>
          <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em]">Wishlist</h1>
        </div>

        {visibleProducts.length === 0 ? (
          <div className="py-24 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-20 text-ink" />
            <p className="text-display-s text-ink font-display font-medium">Your wishlist is empty</p>
            <p className="text-body-sm text-ink-3 mt-2 mb-8">Tap the ♡ on any sneaker to save it here.</p>
            <Link href="/shop" className="inline-block px-8 py-3 text-body-sm font-medium bg-ink text-paper rounded-md hover:bg-ink-2 transition-colors">
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm mb-6 text-ink-2">
              {visibleProducts.length} item{visibleProducts.length !== 1 ? "s" : ""} saved
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {visibleProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
