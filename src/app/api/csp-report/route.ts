import { NextRequest } from "next/server";
import { rateLimit, getIP } from "@/lib/rate-limit";

// Browsers fire reports unprompted and never retry, so this endpoint always answers
// 204 and only decides whether to log. Limits keep one noisy page or a spammer from
// flooding Vercel logs.
const MAX_BODY_BYTES = 16_384;
const MAX_REPORTS_PER_BODY = 10;
const MAX_FIELD_LENGTH = 300;

type Violation = {
  document: string;
  directive: string;
  blocked: string;
  source: string;
  line: number | null;
  disposition: string;
};

const noContent = () => new Response(null, { status: 204 });

function str(v: unknown): string {
  return typeof v === "string" ? v.slice(0, MAX_FIELD_LENGTH) : "";
}

// Drop query strings and fragments: page URLs can carry reset codes, order numbers
// or email addresses that shouldn't end up in logs.
function stripUrl(v: unknown): string {
  const s = str(v);
  try {
    const u = new URL(s);
    return `${u.origin}${u.pathname}`;
  } catch {
    return s; // keywords like "inline", "eval", "data"
  }
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// Legacy report-uri: { "csp-report": { "document-uri": ..., "violated-directive": ... } }
function fromLegacy(r: Record<string, unknown>): Violation {
  return {
    document: stripUrl(r["document-uri"]),
    directive: str(r["effective-directive"] ?? r["violated-directive"]),
    blocked: stripUrl(r["blocked-uri"]),
    source: stripUrl(r["source-file"]),
    line: num(r["line-number"]),
    disposition: str(r["disposition"]),
  };
}

// Reporting API (report-to): [{ type: "csp-violation", body: { documentURL, effectiveDirective, ... } }]
function fromReportingApi(b: Record<string, unknown>): Violation {
  return {
    document: stripUrl(b.documentURL),
    directive: str(b.effectiveDirective),
    blocked: stripUrl(b.blockedURL),
    source: stripUrl(b.sourceFile),
    line: num(b.lineNumber),
    disposition: str(b.disposition),
  };
}

function parse(payload: unknown): Violation[] {
  if (Array.isArray(payload)) {
    return payload
      .filter((r): r is { type: string; body: Record<string, unknown> } =>
        r?.type === "csp-violation" && typeof r.body === "object" && r.body !== null)
      .slice(0, MAX_REPORTS_PER_BODY)
      .map(r => fromReportingApi(r.body));
  }
  const legacy = (payload as Record<string, unknown> | null)?.["csp-report"];
  if (typeof legacy === "object" && legacy !== null) return [fromLegacy(legacy as Record<string, unknown>)];
  return [];
}

export async function POST(req: NextRequest) {
  // Own key scope, like every route, so CSP noise can't eat a visitor's quota elsewhere.
  if (!(await rateLimit(`csp:${getIP(req)}`, 20, 60_000)).allowed) return noContent();

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return noContent();

  let payload: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return noContent();
    payload = JSON.parse(text);
  } catch {
    return noContent();
  }

  for (const v of parse(payload)) {
    console.warn("[csp-report]", JSON.stringify(v));
  }
  return noContent();
}
