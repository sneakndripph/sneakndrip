import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      "";
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/** Returns the authenticated user if their app_metadata.role === "admin", else null. */
export async function requireAdmin(): Promise<User | null> {
  const user = await getUser();
  if (!user || user.app_metadata?.role !== "admin") return null;
  return user;
}

/** Returns the authenticated user (any role), else null. */
export async function requireUser(): Promise<User | null> {
  return getUser();
}
