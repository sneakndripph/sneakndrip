export const STATUSES = ["all", "pending", "paid", "stock_on_hand", "processing", "shipped", "delivered", "cancelled"] as const;
export type Status = (typeof STATUSES)[number];
export type RealStatus = Exclude<Status, "all">;
export type StatusMetaEntry = { label: string; text: string; dot: string };

export const STATUS_META: Record<RealStatus, StatusMetaEntry> = {
  pending:       { label: "Pending",   text: "text-ink-3",           dot: "bg-ink-3" },
  paid:          { label: "Confirmed", text: "text-state-onhand",    dot: "bg-state-onhand" },
  stock_on_hand: { label: "On Hand",   text: "text-state-onhand",    dot: "bg-state-onhand" },
  processing:    { label: "Packing",   text: "text-ink-2",           dot: "bg-ink-2" },
  shipped:       { label: "Shipped",   text: "text-state-preorder",  dot: "bg-state-preorder" },
  delivered:     { label: "Delivered", text: "text-state-onhand",    dot: "bg-state-onhand" },
  cancelled:     { label: "Cancelled", text: "text-state-error",     dot: "bg-state-error" },
};

export function statusMeta(status: string) {
  return STATUS_META[status as Exclude<Status, "all">] ?? STATUS_META.pending;
}

export default function OrderStatusBadge({ status, codDelivered = false }: { status: string; codDelivered?: boolean }) {
  const meta = statusMeta(status);
  const label = codDelivered && status === "delivered" ? "Delivered / Cash Collected" : meta.label;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full bg-paper border border-line text-admin-eyebrow ${meta.text}`}>
      {label}
    </span>
  );
}
