import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdminBulk } from "@/lib/supabase/require-admin-bulk";
import { validateBody } from "@/lib/validation/validate";
import { orderBulkUpdateSchema } from "@/lib/validation/schemas";
import { applyStatusChange, STATUS_CHANGE_ORDER_SELECT, type StatusChangeOrder } from "@/lib/orders/apply-status-change";

type Skipped = { id: string; reason: "not_found" | "already_in_status" | "update_failed" };

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminBulk("orders");
  if ("error" in auth) return auth.error;

  const result = await validateBody(req, orderBulkUpdateSchema);
  if ("error" in result) return result.error;
  const { status } = result.data;
  // De-dupe: a repeated id would otherwise run the transition (and restock) twice.
  const ids = [...new Set(result.data.ids)];

  const admin = createAdminClient();
  const { data, error } = await admin.from("orders").select(STATUS_CHANGE_ORDER_SELECT).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byId = new Map((data as StatusChangeOrder[] | null ?? []).map(o => [o.id, o]));
  const skipped: Skipped[] = [];
  const updated: { id: string; patch: Record<string, unknown> }[] = [];

  // Sequential on purpose: cancel restores stock with a read-then-write on
  // product_sizes, so two orders for the same size must not run concurrently.
  for (const id of ids) {
    const order = byId.get(id);
    if (!order) { skipped.push({ id, reason: "not_found" }); continue; }
    if (order.status === status) { skipped.push({ id, reason: "already_in_status" }); continue; }

    const change = await applyStatusChange(admin, order, status, auth.user.email ?? null);
    if (change.updated) updated.push({ id, patch: change.patch });
    else {
      if (change.error) console.error(`[orders-bulk] ${order.order_number} failed:`, change.error);
      skipped.push({ id, reason: change.skipped });
    }
  }

  console.log(`Bulk status → ${status}: ${updated.length} updated, ${skipped.length} skipped`);

  return NextResponse.json({
    updated: updated.length,
    skipped,
    ids: updated.map(u => u.id),
    rows: updated.map(u => ({ id: u.id, ...u.patch })),
  });
}
