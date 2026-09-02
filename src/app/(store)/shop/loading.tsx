import ProductCardSkeleton from "@/components/ui/ProductCardSkeleton";

export default function ShopLoading() {
  return (
    <div className="bg-paper min-h-screen">
      <div className="py-10 pb-6 border-b border-line">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12">
          <div className="h-2.5 w-16 rounded bg-line/50 animate-pulse mb-3" />
          <div className="h-8 w-48 rounded bg-line/50 animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-8">
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10 lg:items-start">
          {/* Desktop sidebar placeholder */}
          <aside className="hidden lg:block space-y-7">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-2.5 w-14 rounded bg-line/50 animate-pulse mb-3" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-6 w-14 rounded-sm bg-line/50 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </aside>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-11 rounded-md bg-line/50 animate-pulse" />
              <div className="w-[170px] h-10 rounded-md bg-line/50 animate-pulse" />
            </div>
            <div className="h-3 w-32 rounded bg-line/50 animate-pulse mb-5" />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
