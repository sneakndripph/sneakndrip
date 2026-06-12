import { BRAND, FONTS } from "@/lib/constants";

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // **bold**, __underline__, ~~strike~~, _italic_ — order: longer patterns first
  const re = /(\*\*([^*\n]+)\*\*|__([^_\n]+)__|~~([^~\n]+)~~|_([^_\n]+)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const key = idx++;
    if (m[0].startsWith("**")) parts.push(<strong key={key} style={{ fontWeight: 700 }}>{m[2]}</strong>);
    else if (m[0].startsWith("__")) parts.push(<u key={key}>{m[3]}</u>);
    else if (m[0].startsWith("~~")) parts.push(<s key={key}>{m[4]}</s>);
    else parts.push(<em key={key}>{m[5]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function PageContent({ text }: { text: string }) {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return (
    <div style={{ fontFamily: FONTS.body }}>
      {paragraphs.map((p, i) => {
        // H1 — big heading
        if (p.startsWith("# ")) {
          return (
            <p key={i} className="mt-8 mb-3 first:mt-0"
              style={{ fontSize: "1.5rem", fontWeight: 700, color: BRAND.black, letterSpacing: "0.01em", lineHeight: 1.3 }}>
              {renderInline(p.slice(2))}
            </p>
          );
        }

        // H3 — sub-heading (medium, precedes ## to avoid prefix collision)
        if (p.startsWith("### ")) {
          return (
            <p key={i} className="mt-6 mb-2 first:mt-0"
              style={{ fontSize: "1rem", fontWeight: 600, color: BRAND.black }}>
              {renderInline(p.slice(4))}
            </p>
          );
        }

        // H2 — tiny uppercase section label (original ## behaviour)
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

        // Alignment — [center] or [right] at paragraph start
        let align: "left" | "center" | "right" = "left";
        let content = p;
        if (p.startsWith("[center]")) { align = "center"; content = p.slice(8).trim(); }
        else if (p.startsWith("[right]"))  { align = "right";  content = p.slice(7).trim(); }

        // Bullet list — block where at least one line starts with - or •
        const lines = content.split("\n").filter(Boolean);
        if (lines.length > 0 && lines.some(l => l.startsWith("- ") || l.startsWith("• "))) {
          return (
            <ul key={i} className="space-y-2 mb-5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed"
                  style={{ color: BRAND.muted, fontWeight: 400 }}>
                  <span style={{ color: BRAND.teal, flexShrink: 0, lineHeight: "1.6" }}>–</span>
                  <span>{renderInline(l.replace(/^[•\-] /, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed mb-5"
            style={{ color: BRAND.muted, fontWeight: 400, textAlign: align }}>
            {renderInline(content)}
          </p>
        );
      })}
    </div>
  );
}
