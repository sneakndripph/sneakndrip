import { createClient } from "@supabase/supabase-js";
import { validateEnv } from "@/lib/env";

export function createAdminClient() {
  const env = validateEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
