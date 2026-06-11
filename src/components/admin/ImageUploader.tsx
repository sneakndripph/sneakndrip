"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Upload, X, Crop, Loader2, AlertCircle } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface ImageEntry {
  id: string;
  preview: string;
  url?: string;
  uploading?: boolean;
  error?: string;
}

async function cropToSquare(src: string, pixels: Area): Promise<File> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, 1000, 1000);
      canvas.toBlob(blob => {
        resolve(new File([blob!], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    };
    image.src = src;
  });
}

async function uploadFile(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(data.path);
  return publicUrl;
}

export default function ImageUploader({
  onChange,
  initialUrls = [],
}: {
  onChange: (urls: string[]) => void;
  initialUrls?: string[];
}) {
  const [entries, setEntries] = useState<ImageEntry[]>(() =>
    initialUrls.map(url => ({ id: crypto.randomUUID(), preview: url, url }))
  );
  const [cropIdx, setCropIdx] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedPixels(pixels), []);

  function notify(list: ImageEntry[]) {
    onChange(list.filter(e => e.url).map(e => e.url!));
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const fileArray = Array.from(files);
    const newEntries: ImageEntry[] = fileArray.map(file => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      uploading: true,
    }));
    setEntries(prev => [...prev, ...newEntries]);

    await Promise.all(
      newEntries.map(async (entry, i) => {
        try {
          const url = await uploadFile(fileArray[i]);
          setEntries(prev => {
            const next = prev.map(e => e.id === entry.id ? { ...e, uploading: false, url } : e);
            notify(next);
            return next;
          });
        } catch (err) {
          setEntries(prev =>
            prev.map(e => e.id === entry.id ? { ...e, uploading: false, error: String(err) } : e)
          );
        }
      })
    );
  }

  async function applyCrop() {
    if (cropIdx === null || !croppedPixels) return;
    const idx = cropIdx;
    const entryId = entries[idx].id;
    const preview = entries[idx].preview;
    setCropIdx(null);

    const croppedFile = await cropToSquare(preview, croppedPixels);
    const newPreview = URL.createObjectURL(croppedFile);

    setEntries(prev =>
      prev.map(e => e.id === entryId ? { ...e, preview: newPreview, uploading: true, url: undefined, error: undefined } : e)
    );

    try {
      const url = await uploadFile(croppedFile);
      setEntries(prev => {
        const next = prev.map(e => e.id === entryId ? { ...e, uploading: false, url } : e);
        notify(next);
        return next;
      });
    } catch (err) {
      setEntries(prev =>
        prev.map(e => e.id === entryId ? { ...e, uploading: false, error: String(err) } : e)
      );
    }
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
        <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>JPG, PNG, WEBP · Uploads directly to storage</p>
      </label>

      {/* Thumbnails grid */}
      {entries.length > 0 && (
        <>
          <p className="text-[11px] mb-2" style={{ color: BRAND.muted }}>
            Drag to reorder · Tap ✂ to crop · First photo is the cover
          </p>
          <div className="grid grid-cols-3 gap-2">
            {entries.map((entry, i) => (
              <div key={entry.id} draggable={!entry.uploading}
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                className="relative aspect-square rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
                style={{
                  border: `2px solid ${entry.error ? BRAND.red : dragOverIdx === i ? BRAND.teal : i === 0 ? BRAND.black : BRAND.border}`,
                  opacity: dragIdx === i ? 0.4 : 1,
                  transition: "opacity 0.15s",
                }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.preview} alt="" className="w-full h-full object-cover" />

                {/* Upload overlay */}
                {entry.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}

                {/* Error overlay */}
                {entry.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center"
                    style={{ background: "rgba(0,0,0,0.7)" }}>
                    <AlertCircle className="w-4 h-4 text-red-400 mb-0.5" />
                    <p className="text-[9px] text-red-300 leading-tight">Upload failed</p>
                  </div>
                )}

                {/* Cover badge */}
                {i === 0 && !entry.uploading && !entry.error && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white rounded-sm"
                    style={{ background: BRAND.black }}>Cover</div>
                )}

                {/* Action buttons */}
                {!entry.uploading && (
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    {!entry.error && (
                      <button type="button"
                        onClick={() => { setCropIdx(i); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                        className="w-6 h-6 rounded-sm flex items-center justify-center shadow"
                        style={{ background: BRAND.teal }}>
                        <Crop className="w-3 h-3 text-white" />
                      </button>
                    )}
                    <button type="button" onClick={() => remove(i)}
                      className="w-6 h-6 rounded-sm flex items-center justify-center shadow"
                      style={{ background: BRAND.red }}>
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
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
