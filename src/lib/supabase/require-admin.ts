import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { validateEnv } from "@/lib/env";

async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const env = validateEnv();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
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
