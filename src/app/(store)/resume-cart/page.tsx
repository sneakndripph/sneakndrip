import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-admin";

// Cart abandonment emails link here instead of straight to /cart — at
// send-time we can't know whether the click will land in a signed-in
// session, so this resolves it at click-time instead.
export default async function ResumeCartPage() {
  const user = await requireUser();
  redirect(user ? "/cart" : "/login?redirect=/cart");
}
