"use client";

import { Suspense, useEffect, useLayoutEffect, useState } from "react";
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

/**
 * Expires every GA cookie (_ga, _ga_<ID>, legacy variants). GA's default
 * cookie_domain "auto" writes to the highest settable domain, so we try
 * host-only plus every parent suffix of the current hostname.
 */
function deleteGaCookies() {
  const names = document.cookie
    .split(";")
    .map(c => c.split("=")[0].trim())
    .filter(name => /^_ga(_|$)/.test(name));
  if (names.length === 0) return;

  const parts = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) {
    const suffix = parts.slice(i).join(".");
    domains.push(`; domain=${suffix}`, `; domain=.${suffix}`);
  }
  const secure = window.location.protocol === "https:" ? "; secure" : "";

  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}${secure}`;
    }
  }
}

export default function GoogleAnalytics() {
  const gaId = publicEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  // null until consent is read, so the first render can't trigger the
  // withdrawal path and wipe _ga for visitors who did consent.
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean | null>(null);

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

  // next/script never removes a loaded script, so gtag.js keeps running after
  // unmount. Stop it at runtime instead: ga-disable-<ID> makes gtag.js drop
  // every hit (including anything still queued in dataLayer), and the consent
  // update stops it writing cookies before we delete the existing ones.
  // Layout effect so the flag flips before PageViewTracker's (child, passive)
  // effect fires its page_view on re-enable.
  useLayoutEffect(() => {
    if (!gaId || analyticsEnabled === null) return;
    const disableFlag = window as unknown as Record<string, unknown>;
    if (analyticsEnabled) {
      disableFlag[`ga-disable-${gaId}`] = false;
      window.gtag?.("consent", "update", { analytics_storage: "granted" });
    } else {
      disableFlag[`ga-disable-${gaId}`] = true;
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      deleteGaCookies();
    }
  }, [analyticsEnabled, gaId]);

  if (!gaId || !analyticsEnabled) return null;

  // Consent Mode v2, basic mode: gtag.js only loads after consent, but the
  // default is still declared denied before config. Ad signals stay denied
  // permanently since the store runs no ads.
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('consent', 'update', { analytics_storage: 'granted' });
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });`}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker gaId={gaId} />
      </Suspense>
    </>
  );
}
