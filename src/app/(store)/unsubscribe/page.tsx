import Link from "next/link";
import { MailX, AlertCircle } from "lucide-react";
import { EmailType } from "@/lib/email/preferences";
import { parseSignedUnsubscribe, applyUnsubscribe } from "@/lib/email/unsubscribe";
import ResubscribeButton from "./ResubscribeButton";

const CATEGORY_LABELS: Record<EmailType, string> = {
  [EmailType.CartReminder]: "Cart reminders",
  [EmailType.NewArrival]: "New arrival announcements",
  [EmailType.RestockAlert]: "Restock alerts",
  [EmailType.Newsletter]: "Newsletter",
};

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Two entry points: signed one-click links (?email=&category=&sig=), which are
 * verified and applied here, and the legacy token flow, where
 * /api/unsubscribe has already applied it and redirects here with no params.
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const sig = first(params.sig);

  if (sig === undefined) return <LegacyUnsubscribed />;

  const email = first(params.email);
  const category = first(params.category);
  const signed = parseSignedUnsubscribe(email, category, sig);
  if (!signed) {
    return (
      <Shell icon={<AlertCircle className="w-10 h-10 text-ink" />} heading="Link Not Valid">
        This unsubscribe link is invalid or expired. Need help? Email{" "}
        <a href="mailto:hello@sneakndrip.ph" className="underline text-ink">hello@sneakndrip.ph</a>.
      </Shell>
    );
  }

  const ok = await applyUnsubscribe(signed);
  if (!ok) {
    return (
      <Shell icon={<AlertCircle className="w-10 h-10 text-ink" />} heading="Something Went Wrong">
        We couldn&apos;t process your request. Please try the link again in a moment.
      </Shell>
    );
  }

  return (
    <Shell icon={<MailX className="w-10 h-10 text-ink" />} heading="You're Unsubscribed">
      You&apos;ve been unsubscribed from {CATEGORY_LABELS[signed.category].toLowerCase()}.
      <ResubscribeButton email={signed.email} category={signed.category} sig={sig} />
    </Shell>
  );
}

function LegacyUnsubscribed() {
  return (
    <Shell icon={<MailX className="w-10 h-10 text-ink" />} heading="You're Unsubscribed">
      You&apos;ve been unsubscribed from Sneak N&apos; Drip emails. Sorry to see you go. You can
      resubscribe anytime from the newsletter form on our homepage.
      <div className="space-y-3 mt-8">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-4 font-bold text-sm uppercase tracking-widest bg-ink text-paper"
        >
          Back to Homepage
        </Link>
        <Link
          href="/shop"
          className="flex items-center justify-center gap-2 w-full py-4 font-bold text-sm uppercase tracking-widest border-[1.5px] border-line text-ink"
        >
          Continue Shopping
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ icon, heading, children }: { icon: React.ReactNode; heading: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-paper font-body">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-ink/[9%]">
          {icon}
        </div>
        <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-3">
          {heading}
        </h1>
        <div className="text-sm leading-relaxed text-ink-2">{children}</div>
      </div>
    </div>
  );
}
