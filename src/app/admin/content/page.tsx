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

  let dbRows: Array<{ slug: string; content: string }> = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("site_pages").select("slug, content");
    dbRows = data ?? [];
  } catch { /* table not yet created — show empty editors */ }

  const pages = PAGE_DEFS.map(def => ({
    ...def,
    content: dbRows.find(r => r.slug === def.slug)?.content ?? "",
  }));

  return <AdminContentClient pages={pages} />;
}
