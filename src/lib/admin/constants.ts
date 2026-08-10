export const BRAND = {
  bg: "#F2F0EF",
  card: "#FFFFFF",
  black: "#0D0D0D",
  teal: "#5BB8B4",
  red: "#D94F3D",
  muted: "#8A8580",
  mutedLight: "#B0ABA5",
  border: "rgba(13,13,13,0.09)",
  cardBorder: "rgba(13,13,13,0.07)",
  inputBg: "#F8F7F6",
} as const;

// TODO: conditional Barlow for admin only — --font-barlow is not currently
// loaded by any next/font call, so FONTS.display falls back to sans-serif.
export const FONTS = {
  display: "var(--font-barlow), sans-serif",
  body: "var(--font-inter), sans-serif",
} as const;
