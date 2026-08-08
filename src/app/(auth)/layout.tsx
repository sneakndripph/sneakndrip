import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="px-5 md:px-8 pt-8">
        <Link href="/" className="inline-block">
          <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={120} height={48} className="object-contain" />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-5 md:px-8 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
