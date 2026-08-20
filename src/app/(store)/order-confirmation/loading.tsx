export default function OrderConfirmationLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-paper font-body">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-line/50 animate-pulse mx-auto mb-6" />
          <div className="h-8 w-48 rounded bg-line/50 animate-pulse mx-auto mb-3" />
          <div className="h-3 w-24 rounded bg-line/50 animate-pulse mx-auto mb-2" />
          <div className="h-6 w-32 rounded bg-line/50 animate-pulse mx-auto" />
        </div>

        <div className="rounded-xl border border-line p-5 mb-4 space-y-3">
          <div className="h-3 w-20 rounded bg-line/50 animate-pulse" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-line/50 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-line/50 animate-pulse" />
                <div className="h-2.5 w-1/3 rounded bg-line/50 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-line p-5 mb-5 space-y-2">
          <div className="h-3 w-16 rounded bg-line/50 animate-pulse" />
          <div className="h-3.5 w-full rounded bg-line/50 animate-pulse" />
          <div className="h-3.5 w-2/3 rounded bg-line/50 animate-pulse" />
        </div>

        <div className="space-y-3">
          <div className="h-12 w-full rounded bg-line/50 animate-pulse" />
          <div className="h-12 w-full rounded bg-line/50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
