import { BRAND, FONTS } from "@/lib/constants";

export function PageContent({ text }: { text: string }) {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return (
    <div style={{ fontFamily: FONTS.body }}>
      {paragraphs.map((p, i) => {
        if (p.startsWith("## ")) {
          return (
            <p key={i} className="mt-8 mb-2 first:mt-0"
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: BRAND.mutedLight,
              }}>
              {p.slice(3)}
            </p>
          );
        }
        const lines = p.split("\n").filter(Boolean);
        if (lines.length > 1 && lines.some(l => l.startsWith("- ") || l.startsWith("• "))) {
          return (
            <ul key={i} className="space-y-2 mb-5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed"
                  style={{ color: BRAND.muted, fontWeight: 400 }}>
                  <span style={{ color: BRAND.teal, flexShrink: 0, lineHeight: "1.6" }}>–</span>
                  <span>{l.replace(/^[•\-] /, "")}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed mb-5"
            style={{ color: BRAND.muted, fontWeight: 400 }}>
            {p}
          </p>
        );
      })}
    </div>
  );
}
