"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

export default function PhotoLightbox({
  src,
  alt,
  isOpen,
  onClose,
}: {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("center center");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  function reset() {
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      reset();
      onClose();
    }
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (zoomed) {
      reset();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = ((e.clientX - rect.left) / rect.width) * 100;
    const originY = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${originX}% ${originY}%`);
    setZoomed(true);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!zoomed) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!zoomed || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[200] bg-black/80 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          aria-label={alt}
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          onClick={onClose}
        >
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </DialogPrimitive.Close>
          <div
            className="relative w-full max-w-4xl max-h-[90vh] aspect-square"
            onClick={e => e.stopPropagation()}
          >
            <div
              className={`relative w-full h-full overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
              onClick={handleImageClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: zoomed ? "none" : "auto" }}
            >
              <Image
                src={src}
                alt={alt}
                fill
                draggable={false}
                className="object-contain select-none"
                style={{
                  transform: zoomed ? `scale(2) translate(${pan.x / 2}px, ${pan.y / 2}px)` : "scale(1)",
                  transformOrigin: origin,
                  transition: dragRef.current ? "none" : "transform 200ms",
                }}
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
