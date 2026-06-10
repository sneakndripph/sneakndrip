import { createAdminClient } from "@/lib/supabase/admin-server";
import AdminReviewsClient from "@/components/admin/AdminReviewsClient";

export default async function AdminReviewsPage() {
  const admin = createAdminClient();
  const { data: reviews } = await admin
    .from("reviews")
    .select("id, product_id, author_name, rating, title, body, is_verified, created_at, products(name)")
    .order("created_at", { ascending: false });

  const enriched = (reviews ?? []).map(r => {
    const prod = r.products as { name: string } | { name: string }[] | null;
    return {
      ...r,
      product_name: (Array.isArray(prod) ? prod[0]?.name : prod?.name) ?? undefined,
      products: undefined,
    };
  });

  return <AdminReviewsClient initialReviews={enriched} />;
}
