import type { Metadata } from "next";
import ConsentForm from "@/components/auth/ConsentForm";
import { safeNext } from "@/lib/safe-redirect";
import { requireUser } from "@/lib/supabase/require-admin";
import { isNewAccount } from "@/lib/email/marketing-choice";

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
  // Only a just-created account is offered the marketing opt-in, so an existing
  // user re-accepting updated Terms keeps their current email preferences.
  const user = await requireUser();
  // Validate on the server so the client form only ever receives a same-site path
  return (
    <ConsentForm
      next={safeNext(typeof next === "string" ? next : null)}
      isNewAccount={user ? isNewAccount(user) : false}
    />
  );
}
