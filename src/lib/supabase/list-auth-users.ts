import type { SupabaseClient, User } from "@supabase/supabase-js";

// GoTrue caps perPage at 1000; page until a short page comes back.
const PER_PAGE = 1000;
// Safety stop so a misbehaving API can't loop forever (100k accounts).
const MAX_PAGES = 100;

/** Every auth user, across all pages of auth.admin.listUsers. */
export async function listAllAuthUsers(admin: SupabaseClient): Promise<User[]> {
  const all: User[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) {
      console.error("[listAllAuthUsers] page", page, "failed:", error);
      break;
    }
    all.push(...data.users);
    if (data.users.length < PER_PAGE) break;
  }
  return all;
}
