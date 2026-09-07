import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET() {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("store_settings").select("key, value");
  if (error) return NextResponse.json({}, { status: 200 });
  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value;
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, string>;
  const admin = createAdminClient();

  const keys = Object.keys(body);
  const { data: current } = await admin.from("store_settings").select("key, value").in("key", keys);
  const currentMap = new Map((current ?? []).map(r => [r.key, r.value]));
  const changedFields = keys.filter(k => currentMap.get(k) !== String(body[k]));

  const rows = Object.entries(body).map(([key, value]) => ({ key, value: String(value) }));
  const { error } = await admin.from("store_settings").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (changedFields.length > 0) {
    try {
      const { error: logError } = await admin.from("activity_log").insert({
        action: "settings_updated",
        entity_type: "settings",
        entity_id: null,
        entity_name: "Store settings",
        actor_email: caller.email ?? null,
        details: { changed_fields: changedFields },
      });
      if (logError) console.error("[activity_log] insert failed:", logError);
    } catch (err) {
      console.error("[activity_log] insert failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
