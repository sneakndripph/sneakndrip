export default function AdminLoading() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-line/50 animate-pulse" />
          <div className="h-3 w-32 rounded bg-line/50 animate-pulse" />
        </div>
        <div className="h-9 w-40 rounded-md bg-line/50 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-paper border border-line rounded-md p-5 space-y-3">
            <div className="h-2.5 w-16 rounded bg-line/50 animate-pulse" />
            <div className="h-6 w-20 rounded bg-line/50 animate-pulse" />
            <div className="h-2.5 w-24 rounded bg-line/50 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-3 mb-4">
        <div className="lg:col-span-2 bg-paper border border-line rounded-md p-5 h-72 flex items-end gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-t bg-line/50 animate-pulse" style={{ height: `${30 + (i % 5) * 12}%` }} />
          ))}
        </div>
        <div className="bg-paper border border-line rounded-md p-5 h-72 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-line/50 animate-pulse" />
        </div>
      </div>

      <div className="bg-paper border border-line rounded-md p-5">
        <div className="h-4 w-28 rounded bg-line/50 animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-full rounded bg-line/50 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
