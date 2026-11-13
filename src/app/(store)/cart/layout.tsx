import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your Bag — Sneak N' Drip" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
