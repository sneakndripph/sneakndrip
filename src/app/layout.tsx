import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import AppToaster from "@/components/layout/AppToaster";
import ProgressBar from "@/components/layout/ProgressBar";
import SiteSplash from "@/components/ui/SiteSplash";
import SiteStructuredData from "@/components/SiteStructuredData";
import { validateEnv } from "@/lib/env";
import "./globals.css";

// Runs once at server startup (build + first request). Throws with a clear message
// if a REQUIRED env var is missing, instead of failing mysteriously deep in a route.
validateEnv();

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sneakndrip.ph"),
  title: "Sneak N' Drip — Authentic Sneakers Philippines",
  description:
    "100% Authentic Sneakers. On Hand & Pre-Order. Shop the latest releases at Sneak N' Drip.",
  icons: {
    icon: "/sneakndrip-logo.gif",
    shortcut: "/sneakndrip-logo.gif",
    apple: "/sneakndrip-logo.gif",
  },
  openGraph: {
    siteName: "Sneak N' Drip",
    title: "Sneak N' Drip — Authentic Sneakers Philippines",
    description: "100% Authentic Sneakers. On Hand & Pre-Order. Shop the latest releases at Sneak N' Drip.",
    url: "https://sneakndrip.ph",
    type: "website",
    images: [{ url: "/sneakndrip-logo.png", width: 512, height: 512, alt: "Sneak N' Drip" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sneak N' Drip — Authentic Sneakers Philippines",
    description: "100% Authentic Sneakers. On Hand & Pre-Order. Shop the latest releases at Sneak N' Drip.",
    images: ["/sneakndrip-logo.png"],
  },
  alternates: {
    canonical: "https://sneakndrip.ph",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper font-body text-ink">
        <SiteStructuredData />
        <SiteSplash />
        <ProgressBar />
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
