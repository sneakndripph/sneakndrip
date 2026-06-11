"use client";

import { useState } from "react";

interface Props {
  brand: string;
  color?: string;
  size?: number;
}

// Map brand → domain used by logo services
const BRAND_DOMAINS: Record<string, string> = {
  Nike: "nike.com",
  Jordan: "nike.com",
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

// Fallback: text-based brand marks that always render
function TextLogo({ brand, color, size }: { brand: string; color: string; size: number }) {
  const short = brand.length <= 5 ? brand : brand.split(" ").map(w => w[0]).join("");
  return (
    <span style={{
      fontFamily: "'Arial Black', 'Arial Bold', Impact, sans-serif",
      fontSize: size * 0.5,
      fontWeight: 900,
      color,
      letterSpacing: "-0.03em",
      lineHeight: 1,
      display: "block",
      textAlign: "center",
    }}>
      {short.toUpperCase()}
    </span>
  );
}

export default function BrandLogo({ brand, color = "currentColor", size = 48 }: Props) {
  const [tryIndex, setTryIndex] = useState(0);
  const domain = BRAND_DOMAINS[brand];

  const sources = domain ? [
    `https://logo.clearbit.com/${domain}?size=128`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ] : [];

  if (sources.length > 0 && tryIndex < sources.length) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sources[tryIndex]}
        alt={brand}
        onError={() => setTryIndex(i => i + 1)}
        style={{ objectFit: "contain", width: size, height: size, display: "block" }}
      />
    );
  }

  return <TextLogo brand={brand} color={color} size={size} />;
}
