import { createAdminClient } from "@/lib/supabase/admin-server";

export async function getPageContent(slug: string, fallback: string): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_pages")
      .select("content")
      .eq("slug", slug)
      .maybeSingle();
    return data?.content ?? fallback;
  } catch {
    return fallback;
  }
}
