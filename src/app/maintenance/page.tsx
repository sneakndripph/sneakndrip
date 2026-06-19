import Image from "next/image";
import { BRAND, FONTS } from "@/lib/constants";

export default function MaintenancePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: BRAND.black, fontFamily: FONTS.body }}
    >
      <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={160} height={64} className="object-contain mb-10" />

      <h1
        style={{
          fontFamily: FONTS.display,
          fontSize: "clamp(2.5rem, 8vw, 5rem)",
          letterSpacing: "0.04em",
          color: BRAND.bg,
          lineHeight: 1,
        }}
      >
        WE&apos;LL BE<br />
        <span style={{ color: BRAND.teal }}>BACK SOON</span>
      </h1>

      <p className="mt-6 text-sm max-w-sm leading-relaxed" style={{ color: "#666" }}>
        We&apos;re making some updates to bring you a better experience.
        Check back in a little while — it won&apos;t be long!
      </p>

      <div className="flex gap-4 mt-10">
        <a
          href="https://www.facebook.com/SneakNDrip/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold uppercase tracking-widest px-5 py-3 transition-opacity hover:opacity-70"
          style={{ border: `1px solid rgba(255,255,255,0.12)`, color: "#666" }}
        >
          Facebook
        </a>
        <a
          href="https://www.instagram.com/sneakndripph/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold uppercase tracking-widest px-5 py-3 transition-opacity hover:opacity-70"
          style={{ border: `1px solid rgba(255,255,255,0.12)`, color: "#666" }}
        >
          Instagram
        </a>
      </div>

      <p className="mt-12 text-xs" style={{ color: "#333" }}>© 2025 Sneak N&apos; Drip · Philippines</p>
    </div>
  );
}
