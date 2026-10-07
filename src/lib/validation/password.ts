import { z } from "zod";

export type PasswordRule = {
  id: "length" | "upper" | "lower" | "number" | "symbol";
  label: string;
  test: (p: string) => boolean;
};

/**
 * Single source of truth for password requirements — drives both the client
 * checklist (src/components/auth/PasswordChecklist.tsx) and server validation.
 * Mirror any change here in the Supabase Auth dashboard password policy.
 */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: "length", label: "At least 10 characters", test: p => p.length >= 10 },
  { id: "upper", label: "One uppercase letter", test: p => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: p => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: p => /[0-9]/.test(p) },
  // Exactly Supabase Auth's symbol set: !@#$%^&*()_+-=[]{};'\:"|<>?,./`~ — spaces,
  // ₱, accented letters and emoji don't count, or the server would reject passwords the checklist passed.
  { id: "symbol", label: "One symbol (!@#$%^&*…)", test: p => /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/.test(p) },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every(r => r.test(password));
}

/** New-password field — reports one issue per unmet rule. */
export const passwordSchema = z.string().superRefine((p, ctx) => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(p)) ctx.addIssue({ code: "custom", message: `Password needs: ${rule.label.toLowerCase()}` });
  }
});
