import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sneak N' Drip — Authentic Sneakers Philippines",
  description:
    "100% Authentic Sneakers. On Hand & Pre-Order. Shop the latest releases at Sneak N' Drip.",
  icons: {
    icon: "/sneakndrip-logo.png",
    shortcut: "/sneakndrip-logo.png",
    apple: "/sneakndrip-logo.png",
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
      className={`${inter.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: "var(--font-inter), sans-serif", fontSize: "0.875rem" },
            success: { iconTheme: { primary: "#5BB8B4", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
