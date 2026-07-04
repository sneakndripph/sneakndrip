import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ProgressBar from "@/components/layout/ProgressBar";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sneak N' Drip — Authentic Sneakers Philippines",
  description:
    "100% Authentic Sneakers. On Hand & Pre-Order. Shop the latest releases at Sneak N' Drip.",
  icons: {
    icon: "/sneakndrip-logo.gif",
    shortcut: "/sneakndrip-logo.gif",
    apple: "/sneakndrip-logo.gif",
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
      className={`${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ProgressBar />
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: "var(--font-bebas), sans-serif", fontSize: "0.875rem" },
            success: { iconTheme: { primary: "#5BB8B4", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
