"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND, FONTS } from "@/lib/constants";
import ProductCard from "@/components/product/ProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data: { user } }) => {
        if (!user) { router.push("/login?redirect=/wishlist"); return; }
        setAuthChecked(true);
      });
    });
  }, [router]);

  useEffect(() => {
    if (!authChecked || wishlistLoading || wishlist.length === 0) {
      setProducts([]);
      return;
    }
    fetch(`/api/wishlist/products?ids=${wishlist.join(",")}`)
      .then(r => r.ok ? r.json() : { products: [] })
      .then(d => setProducts(d.products ?? []));
  }, [wishlist, wishlistLoading, authChecked]);

  const loading = !authChecked || wishlistLoading;
  const visibleProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh", fontFamily: FONTS.body }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.teal }}>My Collection</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "3rem", letterSpacing: "0.04em", color: BRAND.black }}>WISHLIST</h1>
        </div>

        {loading ? (
          <div className="py-24 text-center text-sm" style={{ color: BRAND.muted }}>Loading wishlist…</div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-24 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: BRAND.black }} />
            <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted, letterSpacing: "0.04em" }}>WISHLIST IS EMPTY</p>
            <p className="text-sm mt-2 mb-8" style={{ color: BRAND.mutedLight }}>Tap the ♡ on any sneaker to save it here.</p>
            <Link href="/shop" className="inline-block px-8 py-3 font-black text-sm uppercase tracking-widest"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              Shop Now
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm mb-6" style={{ color: BRAND.muted }}>
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
