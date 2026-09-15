import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * Parses a request's JSON body against a zod schema.
 *
 * Returns `{ data }` on success, or `{ error }` where `error` is a ready-to-return
 * 400 NextResponse shaped `{ error: string, errors: Record<string, string> }` —
 * `error` is a single human-readable summary (kept for existing frontend
 * consumers that read `data.error` as a plain string), `errors` gives per-field
 * detail keyed by dot-path (root-level issues, e.g. a non-object body, use "_root").
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid JSON body", errors: { _root: "Invalid JSON body" } },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.length > 0 ? issue.path.map(String).join(".") : "_root";
      if (!(field in errors)) errors[field] = issue.message; // first issue per field wins
    }
    const firstMessage = result.error.issues[0]?.message ?? "Invalid request";
    return {
      error: NextResponse.json({ error: firstMessage, errors }, { status: 400 }),
    };
  }

  return { data: result.data };
}
