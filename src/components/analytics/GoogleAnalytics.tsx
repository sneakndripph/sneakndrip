"use client";

import { Suspense, useEffect, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { getConsent, CONSENT_CHANGE_EVENT, CONSENT_STORAGE_KEY, type ConsentState } from "@/lib/consent";

/**
 * Fires a page_view on every route change. Split out from GoogleAnalytics so
 * useSearchParams (which suspends during static rendering) has its own
 * Suspense boundary and doesn't block the rest of the tree.
 */
function PageViewTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const query = searchParams.toString();
    window.gtag("event", "page_view", {
      page_path: query ? `${pathname}?${query}` : pathname,
      send_to: gaId,
    });
  }, [pathname, searchParams, gaId]);

  return null;
}

export default function GoogleAnalytics() {
  const gaId = publicEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    setAnalyticsEnabled(getConsent()?.analytics === true);

    function onConsentChange(e: Event) {
      const state = (e as CustomEvent<ConsentState>).detail;
      setAnalyticsEnabled(state?.analytics === true);
    }
    // Cross-tab: another tab writing consent doesn't fire our CustomEvent here.
    function onStorage(e: StorageEvent) {
      if (e.key === CONSENT_STORAGE_KEY) setAnalyticsEnabled(getConsent()?.analytics === true);
    }

    window.addEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, onConsentChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!gaId || !analyticsEnabled) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });`}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker gaId={gaId} />
      </Suspense>
    </>
  );
}
