import Link from "next/link";
import { MailX } from "lucide-react";

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-paper font-body">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-ink/[9%]">
          <MailX className="w-10 h-10 text-ink" />
        </div>

        <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-3">
          You&apos;re Unsubscribed
        </h1>
        <p className="text-sm leading-relaxed text-ink-2 mb-8">
          You&apos;ve been unsubscribed from Sneak N&apos; Drip emails. Sorry to see you go. You can
          resubscribe anytime from the newsletter form on our homepage.
        </p>

        <div className="space-y-3">
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
      </div>
    </div>
  );
}
