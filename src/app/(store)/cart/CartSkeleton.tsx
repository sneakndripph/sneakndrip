export default function CartSkeleton() {
  return (
    <div className="bg-paper min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-12">
        <div className="mb-10 space-y-3">
          <div className="h-2.5 w-20 rounded bg-line/50 animate-pulse" />
          <div className="h-9 w-56 rounded bg-line/50 animate-pulse" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 rounded-md border border-line">
                <div className="w-20 h-20 shrink-0 rounded-md bg-line/50 animate-pulse" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-2.5 w-16 rounded bg-line/50 animate-pulse" />
                  <div className="h-3.5 w-3/4 rounded bg-line/50 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-line/50 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-md border border-line p-6 space-y-4">
            <div className="h-2.5 w-28 rounded bg-line/50 animate-pulse" />
            <div className="h-3.5 w-full rounded bg-line/50 animate-pulse" />
            <div className="h-3.5 w-full rounded bg-line/50 animate-pulse" />
            <div className="h-8 w-full rounded bg-line/50 animate-pulse" />
            <div className="h-12 w-full rounded-md bg-line/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
