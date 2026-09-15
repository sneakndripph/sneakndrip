import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rate-limit";

const BASE = "https://psgc.gitlab.io/api";

const URLS: Record<string, (code: string) => string> = {
  provinces:       (code) => `${BASE}/regions/${code}/provinces.json`,
  "cities-prov":   (code) => `${BASE}/provinces/${code}/cities-municipalities.json`,
  "cities-region": (code) => `${BASE}/regions/${code}/cities-municipalities.json`,
  barangays:       (code) => `${BASE}/cities-municipalities/${code}/barangays.json`,
};

export async function GET(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 60, 60_000);
  if (!allowed) return NextResponse.json([], { status: 429 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const code = searchParams.get("code") ?? "";

  const buildUrl = URLS[type];
  if (!buildUrl || !code) return NextResponse.json([]);

  try {
    const res = await fetch(buildUrl(code), { next: { revalidate: 86400 } });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}
