"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Upload, X, Crop } from "lucide-react";
import { BRAND } from "@/lib/constants";

interface ImageEntry {
  file: File;
  preview: string;
}

async function cropToSquare(src: string, pixels: Area, fileName: string): Promise<File> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 1000;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, size, size);
      canvas.toBlob(blob => {
        resolve(new File([blob!], fileName.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    };
    image.src = src;
  });
}

export default function ImageUploader({ onChange }: { onChange: (files: File[]) => void }) {
  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [cropIdx, setCropIdx] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedPixels(pixels), []);

  function notify(list: ImageEntry[]) {
    onChange(list.map(e => e.file));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added: ImageEntry[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    const updated = [...entries, ...added];
    setEntries(updated);
    notify(updated);
  }

  async function applyCrop() {
    if (cropIdx === null || !croppedPixels) return;
    const entry = entries[cropIdx];
    const croppedFile = await cropToSquare(entry.preview, croppedPixels, entry.file.name);
    const newPreview = URL.createObjectURL(croppedFile);
    const updated = entries.map((e, i) => i === cropIdx ? { file: croppedFile, preview: newPreview } : e);
    setEntries(updated);
    notify(updated);
    setCropIdx(null);
  }

  function remove(idx: number) {
    const updated = entries.filter((_, i) => i !== idx);
    setEntries(updated);
    notify(updated);
  }

  function onDragStart(idx: number) { setDragIdx(idx); }
  function onDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx); }
  function onDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const updated = [...entries];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setEntries(updated);
    notify(updated);
    setDragIdx(null);
    setDragOverIdx(null);
  }

  return (
    <div>
      {/* Drop zone */}
      <label className="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
        style={{ borderColor: entries.length ? BRAND.teal : BRAND.border, marginBottom: entries.length ? "12px" : 0 }}>
        <input type="file" multiple accept="image/*,.jpg,.jpeg,.png,.webp" className="hidden"
          onChange={e => addFiles(e.target.files)} />
        <Upload className="w-6 h-6 mx-auto mb-1.5" style={{ color: BRAND.mutedLight }} />
        <p className="text-sm font-semibold" style={{ color: BRAND.black }}>
          {entries.length ? "Add more photos" : "Upload product photos"}
        </p>
        <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>JPG, PNG, WEBP</p>
      </label>

      {/* Thumbnails grid */}
      {entries.length > 0 && (
        <>
          <p className="text-[11px] mb-2" style={{ color: BRAND.muted }}>
            Drag to reorder · Tap ✂ to crop to square · First photo is the cover
          </p>
          <div className="grid grid-cols-3 gap-2">
            {entries.map((entry, i) => (
              <div key={i} draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                className="relative aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
                style={{
                  border: `2px solid ${dragOverIdx === i ? BRAND.teal : i === 0 ? BRAND.black : BRAND.border}`,
                  opacity: dragIdx === i ? 0.4 : 1,
                  transition: "opacity 0.15s",
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.preview} alt="" className="w-full h-full object-cover" />

                {/* Cover badge */}
                {i === 0 && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white rounded-sm"
                    style={{ background: BRAND.black }}>Cover</div>
                )}

                {/* Action buttons */}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <button type="button"
                    onClick={() => { setCropIdx(i); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                    className="w-6 h-6 rounded-sm flex items-center justify-center shadow"
                    style={{ background: BRAND.teal }}>
                    <Crop className="w-3 h-3 text-white" />
                  </button>
                  <button type="button" onClick={() => remove(i)}
                    className="w-6 h-6 rounded-sm flex items-center justify-center shadow"
                    style={{ background: BRAND.red }}>
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Crop modal */}
      {cropIdx !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl"
            style={{ background: "#fff" }}>
            <div className="relative" style={{ height: 320 }}>
              <Cropper
                image={entries[cropIdx].preview}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold" style={{ color: BRAND.muted }}>Zoom</span>
                <input type="range" min={1} max={3} step={0.01} value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="flex-1" style={{ accentColor: BRAND.teal }} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCropIdx(null)}
                  className="flex-1 py-2.5 text-sm font-bold rounded-lg"
                  style={{ background: "#f5f5f5", color: BRAND.muted }}>
                  Cancel
                </button>
                <button type="button" onClick={applyCrop}
                  className="flex-1 py-2.5 text-sm font-black text-white rounded-lg"
                  style={{ background: BRAND.teal }}>
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
