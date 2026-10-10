import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// Report-only for now: violations are sent to /api/csp-report (Vercel logs)
// without blocking anything. Domains reflect actual third-party usage (GA4 via
// gtag.js, Supabase storage/DB/realtime). GA4 sends hits to regional hosts like
// region1.google-analytics.com, hence the wildcards. vercel.live is not used
// anywhere in this app, so it's omitted rather than copied from a generic template.
const CSP_REPORT_PATH = "/api/csp-report";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sneakndrip.ph";

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  // report-to wins where supported (Chromium); Firefox/Safari fall back to report-uri.
  `report-uri ${CSP_REPORT_PATH}`,
  "report-to csp-endpoint",
].join("; ");

const securityHeaders = [
  // Prevent clickjacking — disallows your site being embedded in iframes
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Force HTTPS for 1 year, include subdomains
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Control referrer info sent to other sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by the store
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Basic XSS protection for older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Report-only CSP: logs violations, doesn't block. Promote to
  // Content-Security-Policy once console/report output confirms nothing
  // legitimate gets flagged.
  { key: "Content-Security-Policy-Report-Only", value: cspDirectives },
  // Defines the csp-endpoint group for report-to. Reporting-Endpoints is what
  // current Chromium reads (relative URL resolves per page, so localhost reports
  // stay local); Report-To is the legacy form and needs an absolute URL.
  { key: "Reporting-Endpoints", value: `csp-endpoint="${CSP_REPORT_PATH}"` },
  {
    key: "Report-To",
    value: JSON.stringify({ group: "csp-endpoint", max_age: 10886400, endpoints: [{ url: `${SITE_URL}${CSP_REPORT_PATH}` }] }),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "sneak-n-drip-footwear-store",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
