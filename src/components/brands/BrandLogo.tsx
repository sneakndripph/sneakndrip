interface Props {
  brand: string;
  color?: string;
  size?: number;
}

export default function BrandLogo({ brand, color = "currentColor", size = 48 }: Props) {
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

    case "New Balance":
      return (
        <svg width={s * 1.4} height={s} viewBox="0 0 56 36" aria-label="New Balance">
          <text x="2" y="28" fill={color}
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>
            NB
          </text>
        </svg>
      );

    case "Converse":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill={color} aria-label="Converse">
          <polygon points="16,2 19.5,11.5 30,11.5 21.5,18 24.5,28 16,21.5 7.5,28 10.5,18 2,11.5 12.5,11.5" />
        </svg>
      );

    case "Vans":
      return (
        <svg width={s * 1.2} height={s} viewBox="0 0 48 32" aria-label="Vans">
          <text x="2" y="26" fill={color}
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>
            VANS
          </text>
        </svg>
      );

    case "Puma":
      return (
        <svg width={s * 1.4} height={s} viewBox="0 0 56 32" aria-label="Puma">
          <text x="2" y="25" fill={color}
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>
            PUMA
          </text>
        </svg>
      );

    case "ASICS":
      return (
        <svg width={s * 1.6} height={s} viewBox="0 0 64 32" aria-label="ASICS">
          <text x="2" y="25" fill={color}
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>
            ASICS
          </text>
        </svg>
      );

    case "Reebok":
      return (
        <svg width={s * 1.7} height={s} viewBox="0 0 68 32" aria-label="Reebok">
          <text x="2" y="25" fill={color}
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: 2 }}>
            REEBOK
          </text>
        </svg>
      );

    case "Salomon":
      return (
        <svg width={s * 2} height={s} viewBox="0 0 80 32" aria-label="Salomon">
          <text x="2" y="25" fill={color}
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 19, fontWeight: 900, letterSpacing: 2 }}>
            SALOMON
          </text>
        </svg>
      );

    case "On Running":
      return (
        <svg width={s * 1.2} height={s} viewBox="0 0 52 36" fill="none" aria-label="On Running">
          <ellipse cx="26" cy="18" rx="22" ry="15" stroke={color} strokeWidth="3" />
          <text x="13" y="22" fill={color}
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 12, fontWeight: 900 }}>
            On
          </text>
        </svg>
      );

    case "Hoka":
      return (
        <svg width={s * 1.4} height={s} viewBox="0 0 56 32" aria-label="Hoka">
          <text x="2" y="25" fill={color}
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>
            HOKA
          </text>
        </svg>
      );

    default:
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" aria-label={brand}>
          <text x="18" y="24" textAnchor="middle" fill={color}
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 20, fontWeight: 900 }}>
            {brand.charAt(0)}
          </text>
        </svg>
      );
  }
}
