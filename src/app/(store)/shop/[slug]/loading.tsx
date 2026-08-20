export default function ProductLoading() {
  return (
    <div className="bg-paper pb-24 lg:pb-0">
      <div className="lg:max-w-7xl lg:mx-auto lg:px-8 xl:px-12 lg:py-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* Gallery */}
          <div className="aspect-square lg:rounded-md bg-line/50 animate-pulse" />

          {/* Info */}
          <div className="px-5 py-6 lg:px-0 lg:py-0 space-y-6">
            <div className="space-y-2">
              <div className="h-2.5 w-20 rounded bg-line/50 animate-pulse" />
              <div className="h-7 w-3/4 rounded bg-line/50 animate-pulse" />
              <div className="h-6 w-28 rounded bg-line/50 animate-pulse" />
            </div>

            <div>
              <div className="h-2.5 w-16 rounded bg-line/50 animate-pulse mb-3" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-md bg-line/50 animate-pulse" />
                ))}
              </div>
            </div>

            <div className="h-12 w-full rounded-md bg-line/50 animate-pulse" />

            <div className="space-y-2 pt-4 border-t border-line">
              <div className="h-3 w-full rounded bg-line/50 animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-line/50 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-line/50 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
