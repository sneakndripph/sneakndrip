import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { validateBody } from "@/lib/validation/validate";
import { contentUpdateSchema } from "@/lib/validation/schemas";

const TITLES: Record<string, string> = {
  shipping:     "Shipping Information",
  returns:      "Returns Policy",
  authenticity: "Authenticity Guarantee",
  contact:      "Contact Us",
  privacy:      "Privacy Policy",
  terms:        "Terms of Service",
  "cookies-policy": "Cookies Policy",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  if (!TITLES[slug]) return NextResponse.json({ error: "Unknown page" }, { status: 400 });

  const result = await validateBody(req, contentUpdateSchema);
  if ("error" in result) return result.error;
  const { content } = result.data;

  const admin = createAdminClient();
  const { error } = await admin.from("site_pages").upsert(
    { slug, title: TITLES[slug], content, updated_at: new Date().toISOString() },
    { onConflict: "slug" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { error: logError } = await admin.from("activity_log").insert({
      action: "content_page_updated",
      entity_type: "content",
      entity_id: slug,
      entity_name: TITLES[slug],
      actor_email: user.email ?? null,
      details: null,
    });
    if (logError) console.error("[activity_log] insert failed:", logError);
  } catch (err) {
    console.error("[activity_log] insert failed:", err);
  }

  return NextResponse.json({ ok: true });
}
