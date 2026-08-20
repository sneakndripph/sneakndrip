import ProductCardSkeleton from "@/components/ui/ProductCardSkeleton";

export default function WishlistLoading() {
  return (
    <div className="bg-paper min-h-screen font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 space-y-3">
          <div className="h-2.5 w-24 rounded bg-line/50 animate-pulse" />
          <div className="h-9 w-40 rounded bg-line/50 animate-pulse" />
        </div>

        <div className="h-3 w-28 rounded bg-line/50 animate-pulse mb-6" />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
