"use client";

import { X } from "lucide-react";

type SizeGuide = { label: string; note: string; rows: string[][] };

const NIKE_ROWS: string[][] = [
  ["US 4","36","3.5","22"],["US 4.5","36.5","4","22.5"],["US 5","37.5","4.5","23"],
  ["US 5.5","38","5","23.5"],["US 6","38.5","5.5","24"],["US 6.5","39","6","24.5"],
  ["US 7","40","6","25"],["US 7.5","40.5","6.5","25.5"],["US 8","41","7","26"],
  ["US 8.5","42","7.5","26.5"],["US 9","42.5","8","27"],["US 9.5","43","8.5","27.5"],
  ["US 10","44","9","28"],["US 10.5","44.5","9.5","28.5"],["US 11","45","10","29"],
  ["US 11.5","45.5","10.5","29.5"],["US 12","46","11","30"],["US 13","47.5","12","31"],
  ["US 14","48.5","13","32"],["US 15","49.5","14","33"],
];

const ADIDAS_ROWS: string[][] = [
  ["US 4","36","3.5","22.5"],["US 4.5","36.5","4","23"],["US 5","37","4.5","23.5"],
  ["US 5.5","38","5","23.5"],["US 6","38.5","5.5","24"],["US 6.5","39","6","24.5"],
  ["US 7","40","6.5","25"],["US 7.5","40.5","7","25.5"],["US 8","41","7.5","26"],
  ["US 8.5","42","8","26.5"],["US 9","42.5","8.5","27"],["US 9.5","43","9","27.5"],
  ["US 10","44","9.5","28"],["US 10.5","44.5","10","28.5"],["US 11","45","10.5","29"],
  ["US 11.5","45.5","11","29.5"],["US 12","46","11.5","30"],["US 13","47.5","12.5","31"],
  ["US 14","48","13.5","32"],
];

const VANS_ROWS: string[][] = [
  ["US 3.5","35","3","22"],["US 4","36","3.5","22.5"],["US 4.5","36.5","4","23"],
  ["US 5","37","4.5","23"],["US 5.5","38","5","23.5"],["US 6","38.5","5.5","24"],
  ["US 6.5","39","6","24.5"],["US 7","40","6.5","25"],["US 7.5","40.5","7","25.5"],
  ["US 8","41","7.5","26"],["US 8.5","42","8","26.5"],["US 9","42.5","8.5","27"],
  ["US 9.5","43","9","27.5"],["US 10","44","9.5","28"],["US 10.5","44.5","10","28.5"],
  ["US 11","45","10.5","29"],["US 12","46","11.5","30"],["US 13","47","12.5","31"],
];

function getSizeGuideData(brand: string): SizeGuide {
  const b = brand.toLowerCase();
  if (b.includes("adidas") || b.includes("yeezy")) {
    return { label: "Adidas / Yeezy", note: "Adidas generally fits true to size. If between sizes, go half size up.", rows: ADIDAS_ROWS };
  }
  if (b.includes("vans")) {
    return { label: "Vans", note: "Vans fits true to size. Slip-ons run half a size large — consider sizing down.", rows: VANS_ROWS };
  }
  if (b.includes("converse")) {
    return { label: "Converse", note: "Converse runs 1–1.5 sizes large. We recommend going 1 size down from your usual US size.", rows: NIKE_ROWS };
  }
  if (b.includes("new balance")) {
    return { label: "New Balance", note: "New Balance fits true to size. Wide widths available — check product details.", rows: NIKE_ROWS };
  }
  return { label: `Nike / Jordan / ${brand}`, note: "Nike and Jordan sizes run true to size. If between sizes, go half size up.", rows: NIKE_ROWS };
}

export default function ProductSizeGuideModal({
  open,
  onClose,
  brand,
}: {
  open: boolean;
  onClose: () => void;
  brand: string;
}) {
  if (!open) return null;
  const sizeGuideData = getSizeGuideData(brand);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden flex flex-col bg-snd-card border border-snd-border max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-snd-black">
          <div>
            <h2 className="font-heading text-white text-[1.1rem]">SIZE GUIDE</h2>
            <p className="text-xs mt-0.5 text-white/60">{sizeGuideData.label} · All sizes in US (men&apos;s)</p>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs mb-3 px-1 text-snd-muted">{sizeGuideData.note}</p>
          <div className="overflow-x-auto rounded-lg border border-snd-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-snd-black">
                  {["US", "EU", "UK", "CM"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-white">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeGuideData.rows.map((row, i) => (
                  <tr key={row[0]} className={`border-b border-snd-border ${i % 2 === 0 ? "bg-snd-bg" : "bg-snd-card"}`}>
                    {row.map((cell, j) => (
                      <td key={j} className={`px-3 py-2.5 font-semibold ${j === 0 ? "text-snd-teal" : "text-snd-black"}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
