import type { Metadata } from "next";
import ConsentForm from "@/components/auth/ConsentForm";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Confirm Terms — Sneak N' Drip",
  robots: { index: false },
};

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { next } = await searchParams;
  // Validate on the server so the client form only ever receives a same-site path
  return <ConsentForm next={safeNext(typeof next === "string" ? next : null)} />;
}
