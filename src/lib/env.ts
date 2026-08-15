const REQUIRED_SERVER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const OPTIONAL_SERVER_ENV = [
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "ADMIN_EMAIL",
  "CRON_SECRET",
] as const;

type RequiredKey = (typeof REQUIRED_SERVER_ENV)[number];
type OptionalKey = (typeof OPTIONAL_SERVER_ENV)[number];

export type ServerEnv = Record<RequiredKey, string> & Record<OptionalKey, string | undefined>;

const OPTIONAL_HINTS: Record<OptionalKey, string> = {
  RESEND_API_KEY: "email notifications disabled",
  RESEND_FROM_EMAIL: "using default from-address",
  ADMIN_EMAIL: "using default admin address",
  CRON_SECRET: "cron endpoints will refuse to run until this is set",
};

let cachedEnv: ServerEnv | null = null;

/**
 * Validates required server env vars, warns on missing optional ones, and returns a
 * typed env object. Throws on the first call if any REQUIRED var is missing. Call this
 * as early as possible (module scope of app/layout.tsx) so misconfiguration surfaces as
 * a boot error instead of a runtime 500 somewhere downstream.
 */
export function validateEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const missingRequired = REQUIRED_SERVER_ENV.filter((key) => !process.env[key]);
  if (missingRequired.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingRequired.join(", ")}\n\n` +
      `Check your .env.local file. See .env.example for the full list.`
    );
  }

  for (const key of OPTIONAL_SERVER_ENV) {
    if (!process.env[key]) {
      console.warn(`⚠️  Optional env var not set: ${key} (${OPTIONAL_HINTS[key]})`);
    }
  }

  const env = {} as ServerEnv;
  for (const key of REQUIRED_SERVER_ENV) env[key] = process.env[key]!;
  for (const key of OPTIONAL_SERVER_ENV) env[key] = process.env[key];

  cachedEnv = env;
  return env;
}

/** Non-throwing status check, e.g. for the admin env banner. Server-only — never import from client code. */
export function getEnvStatus(): { valid: boolean; missing_required: string[]; missing_optional: string[] } {
  const missing_required = REQUIRED_SERVER_ENV.filter((key) => !process.env[key]);
  const missing_optional = OPTIONAL_SERVER_ENV.filter((key) => !process.env[key]);
  return { valid: missing_required.length === 0, missing_required, missing_optional };
}

/**
 * Client-safe subset — only NEXT_PUBLIC_* vars, statically inlined by Next.js at build time.
 * Safe to import from browser code, unlike validateEnv()/getEnvStatus() which read
 * server-only vars via dynamic process.env[key] lookups.
 */
export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
};
