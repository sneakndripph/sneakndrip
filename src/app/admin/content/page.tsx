import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-server";
import AdminContentClient from "@/components/admin/AdminContentClient";

const PAGE_DEFS = [
  { slug: "shipping",     title: "Shipping Information" },
  { slug: "returns",      title: "Returns Policy" },
  { slug: "authenticity", title: "Authenticity Guarantee" },
  { slug: "contact",      title: "Contact Us" },
  { slug: "privacy",      title: "Privacy Policy" },
  { slug: "terms",        title: "Terms of Service" },
];

export default async function AdminContentPage() {
  noStore();

  let dbRows: Array<{ slug: string; content: string; updated_at: string | null }> = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("site_pages").select("slug, content, updated_at");
    dbRows = data ?? [];
  } catch { /* table not yet created — show empty editors */ }

  const pages = PAGE_DEFS.map(def => ({
    ...def,
    content: dbRows.find(r => r.slug === def.slug)?.content ?? "",
    updatedAt: dbRows.find(r => r.slug === def.slug)?.updated_at ?? null,
  }));

  return <AdminContentClient pages={pages} />;
}
