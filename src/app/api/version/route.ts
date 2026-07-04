import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    deployedAt: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "unknown",
    env: process.env.VERCEL_ENV ?? "development",
  });
}
