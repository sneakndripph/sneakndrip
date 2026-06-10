"use client";

import { useState } from "react";

interface Props {
  brand: string;
  color?: string;
  size?: number;
}

const BRAND_DOMAINS: Record<string, string> = {
  Nike: "nike.com",
  Jordan: "jordan.com",
  Adidas: "adidas.com",
  "New Balance": "newbalance.com",
  Puma: "puma.com",
  ASICS: "asics.com",
  Converse: "converse.com",
  Vans: "vans.com",
  Reebok: "reebok.com",
  Salomon: "salomon.com",
  "On Running": "on.com",
  Hoka: "hoka.com",
};

function FallbackLogo({ brand, color, size }: { brand: string; color: string; size: number }) {
  const s = size;
  switch (brand) {
    case "Nike":
      return (
        <svg width={s * 2} height={s} viewBox="0 0 80 32" fill={color} aria-label="Nike">
          <path d="M4 24 C18 16 42 8 76 5 C66 15 46 24 26 26 C16 27 9 26 4 24Z" />
        </svg>
      );
    case "Jordan":
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" stroke={color} strokeWidth="2" aria-label="Jordan">
          <circle cx="18" cy="18" r="14" />
          <path d="M18 4 C14.5 10 14.5 26 18 32" strokeLinecap="round" />
          <path d="M4 18 C10 14.5 26 14.5 32 18" strokeLinecap="round" />
          <path d="M8.5 8.5 C12 13 24 23 27.5 27.5" strokeLinecap="round" />
        </svg>
      );
    case "Adidas":
      return (
        <svg width={s * 0.85} height={s} viewBox="0 0 30 36" fill="none" aria-label="Adidas">
          <line x1="3" y1="34" x2="14" y2="4" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <line x1="13" y1="34" x2="24" y2="4" stroke={color} strokeWidth="4" strokeLinecap="round" />
          <line x1="23" y1="34" x2="34" y2="4" stroke={color} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "Converse":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill={color} aria-label="Converse">
          <polygon points="16,2 19.5,11.5 30,11.5 21.5,18 24.5,28 16,21.5 7.5,28 10.5,18 2,11.5 12.5,11.5" />
        </svg>
      );
    default:
      return (
        <span style={{
          fontFamily: "'Arial Black', Impact, sans-serif",
          fontSize: s * 0.55,
          fontWeight: 900,
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          textAlign: "center" as const,
          display: "block",
        }}>
          {brand.length <= 4 ? brand : brand.split(" ").map(w => w[0]).join("")}
        </span>
      );
  }
}

export default function BrandLogo({ brand, color = "currentColor", size = 48 }: Props) {
  const [imgError, setImgError] = useState(false);
  const domain = BRAND_DOMAINS[brand];

  if (domain && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://logo.clearbit.com/${domain}?size=128`}
        alt={brand}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        style={{ objectFit: "contain", width: size, height: size, display: "block" }}
      />
    );
  }

  return <FallbackLogo brand={brand} color={color} size={size} />;
}
