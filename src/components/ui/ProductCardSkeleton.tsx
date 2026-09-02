export default function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-square rounded-md bg-line/50 animate-pulse" />
      <div className="pt-3 space-y-2">
        <div className="h-2.5 w-1/3 rounded bg-line/50 animate-pulse" />
        <div className="h-3.5 w-4/5 rounded bg-line/50 animate-pulse" />
        <div className="h-3.5 w-1/4 rounded bg-line/50 animate-pulse" />
      </div>
    </div>
  );
}
