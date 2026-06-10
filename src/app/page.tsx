import Link from "next/link";
import Image from "next/image";

const designs = [
  {
    id: 1,
    name: "Cream Culture",
    route: "/design-1",
    accent: "#5BB8B4",
    bg: "#F2F0EF",
    textColor: "#0D0D0D",
    desc: "Kith-inspired light mode. Warm cream background, teal accents from the DRIP logo, clean editorial layout. Premium boutique feel.",
    vibe: ["Cream #F2F0EF", "Teal Accent", "Light Mode", "Kith-inspired"],
  },
  {
    id: 2,
    name: "Midnight Drip",
    route: "/design-2",
    accent: "#5BB8B4",
    bg: "#0D0D0D",
    textColor: "#F2F0EF",
    desc: "GOAT × StockX dark mode. Near-black background with teal and red from the logo. Bold, modern sneakerhead culture.",
    vibe: ["Black #0D0D0D", "Teal Accent", "Dark Mode", "GOAT-inspired"],
  },
  {
    id: 3,
    name: "Street Coral",
    route: "/design-3",
    accent: "#D94F3D",
    bg: "#F2F0EF",
    textColor: "#0D0D0D",
    desc: "SNKRS × Jordan energy. Cream background, red/coral as the hero accent (from the logo glitch + shoe). Bold, streetwear-forward.",
    vibe: ["Cream #F2F0EF", "Red Accent", "Light Mode", "SNKRS-inspired"],
  },
];

export default function DesignPicker() {
  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D", fontFamily: "var(--font-space-grotesk), sans-serif" }}>

      {/* Header */}
      <div className="py-14 text-center px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="rounded-lg px-4 py-2" style={{ background: "#F2F0EF" }}>
            <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={160} height={64} className="object-contain" priority />
          </div>
        </div>

        {/* Logo colour swatches */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[
            { hex: "#5BB8B4", label: "Teal — DRIP" },
            { hex: "#D94F3D", label: "Red — Shoe/Glitch" },
            { hex: "#0D0D0D", label: "Black — Outline" },
            { hex: "#F2F0EF", label: "Cream — BG" },
          ].map(s => (
            <div key={s.hex} className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: s.hex }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "#555" }}>{s.label}</span>
            </div>
          ))}
        </div>

        <h1 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "clamp(2.5rem,6vw,4rem)", letterSpacing: "0.06em", color: "#F2F0EF" }}>
          CHOOSE YOUR DESIGN
        </h1>
        <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: "#555" }}>
          All 3 use your exact logo colors. Click to preview the full interactive homepage.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-5">
          {designs.map((d) => (
            <Link key={d.id} href={d.route} className="group block">
              <div className="overflow-hidden h-full transition-all duration-300 group-hover:-translate-y-1"
                style={{ border: "1px solid rgba(255,255,255,0.07)", background: "#111110" }}>

                {/* Accent bar */}
                <div className="h-1" style={{ background: d.accent }} />

                {/* Mini mockup */}
                <div className="relative overflow-hidden" style={{ height: "220px", background: d.bg }}>
                  {/* Mock nav */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-2"
                    style={{ borderBottom: `1px solid rgba(13,13,13,0.08)`, background: d.bg }}>
                    <div className="w-16 h-2 rounded-sm opacity-70" style={{ background: d.accent }} />
                    <div className="flex gap-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-7 h-1.5 rounded-sm" style={{ background: `${d.textColor}18` }} />
                      ))}
                    </div>
                  </div>

                  {/* Mock hero */}
                  <div className="px-4 pt-4 space-y-2">
                    <div className="h-4 w-32 rounded-sm" style={{ background: `${d.textColor}70` }} />
                    <div className="h-4 w-24 rounded-sm" style={{ background: d.accent, opacity: 0.8 }} />
                    <div className="h-4 w-16 rounded-sm" style={{ background: `${d.textColor}70` }} />
                    <div className="flex gap-2 pt-2">
                      <div className="h-7 w-16 rounded-sm" style={{ background: d.accent }} />
                      <div className="h-7 w-20 rounded-sm" style={{ background: `${d.textColor}12`, border: `1px solid ${d.textColor}20` }} />
                    </div>
                  </div>

                  {/* Mock product grid */}
                  <div className="absolute bottom-3 left-4 right-4 grid grid-cols-3 gap-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="rounded-sm" style={{ aspectRatio: "1", background: `${d.textColor}08`, border: `1px solid ${d.textColor}08` }}>
                        <div className="h-1.5 w-8 rounded-sm m-1.5" style={{ background: d.accent, opacity: 0.5 }} />
                      </div>
                    ))}
                  </div>

                  {/* Hover CTA */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.55)" }}>
                    <span className="font-bold text-sm px-5 py-2.5 uppercase tracking-widest text-white"
                      style={{ background: d.accent, color: d.id === 1 ? "#0D0D0D" : d.id === 2 ? "#0D0D0D" : "#fff" }}>
                      Preview Full Page →
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-xs font-black px-2 py-0.5"
                      style={{ background: `${d.accent}20`, color: d.accent }}>0{d.id}</span>
                    <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.4rem", letterSpacing: "0.06em", color: "#F2F0EF" }}>
                      {d.name}
                    </h2>
                    <div className="ml-auto w-2.5 h-2.5 rounded-full" style={{ background: d.accent }} />
                  </div>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: "#666" }}>{d.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.vibe.map(tag => (
                      <span key={tag} className="text-[10px] font-medium px-2 py-0.5"
                        style={{ border: `1px solid ${d.accent}30`, color: d.accent, background: `${d.accent}10` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 py-6 px-4 text-center" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <p className="text-sm" style={{ color: "#555" }}>
            Click any card → full interactive homepage with your logo, real product cards, hover effects, and all sections.
          </p>
          <p className="text-xs mt-1.5" style={{ color: "#333" }}>
            After you pick, I build the entire site — all 7 pages, Supabase DB, auth, admin dashboard &amp; checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
