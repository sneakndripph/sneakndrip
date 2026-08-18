import Image from "next/image";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-ink font-body">
      <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={160} height={64} className="object-contain mb-10" />

      <h1 className="font-display tracking-[-0.03em] leading-none text-paper text-[length:clamp(2.5rem,8vw,5rem)]">
        WE&apos;LL BE<br />
        BACK SOON
      </h1>

      <p className="mt-6 text-body-sm max-w-sm leading-relaxed text-paper/60">
        We&apos;re making some updates to bring you a better experience.
        Check back in a little while — it won&apos;t be long!
      </p>

      <div className="flex gap-4 mt-10">
        <a
          href="https://www.facebook.com/SneakNDrip/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-eyebrow px-5 py-3 rounded-md transition-opacity hover:opacity-70 border border-paper/[12%] text-paper/60"
        >
          Facebook
        </a>
        <a
          href="https://www.instagram.com/sneakndripph/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-eyebrow px-5 py-3 rounded-md transition-opacity hover:opacity-70 border border-paper/[12%] text-paper/60"
        >
          Instagram
        </a>
      </div>

      <p className="mt-12 text-micro text-paper/40">© 2025 Sneak N&apos; Drip · Philippines</p>
    </div>
  );
}
