import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const TITLES: Record<string, string> = {
  shipping:     "Shipping Information",
  returns:      "Returns Policy",
  authenticity: "Authenticity Guarantee",
  contact:      "Contact Us",
  privacy:      "Privacy Policy",
  terms:        "Terms of Service",
};

async function getRequestingUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequestingUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  if (!TITLES[slug]) return NextResponse.json({ error: "Unknown page" }, { status: 400 });

  const { content } = await req.json() as { content: string };

  const admin = createAdminClient();
  const { error } = await admin.from("site_pages").upsert(
    { slug, title: TITLES[slug], content, updated_at: new Date().toISOString() },
    { onConflict: "slug" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
