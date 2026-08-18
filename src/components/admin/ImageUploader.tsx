"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Upload, X, Crop, Loader2, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
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
  const [zoneActive, setZoneActive] = useState(false);

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

  function onZoneDragOver(e: React.DragEvent) { e.preventDefault(); setZoneActive(true); }
  function onZoneDragLeave() { setZoneActive(false); }
  function onZoneDrop(e: React.DragEvent) {
    e.preventDefault();
    setZoneActive(false);
    addFiles(e.dataTransfer.files);
  }

  function onDragStart(idx: number) { setDragIdx(idx); }
  function onDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx); }
  function onDragLeave() { setDragOverIdx(null); }
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
  function moveUp(idx: number) {
    if (idx === 0) return;
    const updated = [...entries];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    setEntries(updated);
    notify(updated);
  }
  function moveDown(idx: number) {
    if (idx === entries.length - 1) return;
    const updated = [...entries];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    setEntries(updated);
    notify(updated);
  }

  return (
    <div>
      {/* Drop zone */}
      <label
        onDragOver={onZoneDragOver}
        onDragLeave={onZoneDragLeave}
        onDrop={onZoneDrop}
        className={`block border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors duration-admin-fast ${
          zoneActive ? "border-ink-3" : "border-line hover:border-ink-3"
        } ${entries.length ? "mb-4" : ""}`}>
        <input type="file" multiple accept="image/*,.jpg,.jpeg,.png,.webp" className="hidden"
          onChange={e => addFiles(e.target.files)} />
        <Upload className="w-8 h-8 mx-auto mb-2 text-ink-3" />
        <p className="text-admin text-ink-3">Drag images here or click to browse</p>
        <p className="text-admin-micro text-ink-3 mt-1">JPG or PNG · up to 5MB each</p>
      </label>

      {/* Thumbnails grid */}
      {entries.length > 0 && (
        <>
          <p className="text-admin-micro text-ink-3 mb-2">
            Drag to reorder · crop icon to adjust · first photo is the cover
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {entries.map((entry, i) => (
              <div key={entry.id} draggable={!entry.uploading}
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDragLeave={onDragLeave}
                onDrop={() => onDrop(i)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                className={`relative aspect-square rounded-md overflow-hidden cursor-grab active:cursor-grabbing border-2 transition-opacity duration-admin-fast ${
                  entry.error ? "border-state-error" : dragOverIdx === i ? "border-ink-3" : i === 0 ? "border-ink" : "border-line"
                } ${dragIdx === i ? "opacity-40" : "opacity-100"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.preview} alt="" className="w-full h-full object-cover" draggable={false} />

                {/* Upload overlay */}
                {entry.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/60">
                    <Loader2 className="w-5 h-5 text-paper animate-spin" />
                  </div>
                )}

                {/* Error overlay */}
                {entry.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center bg-ink/70">
                    <AlertCircle className="w-4 h-4 text-state-error mb-0.5" />
                    <p className="text-admin-micro text-state-error leading-tight">Upload failed</p>
                  </div>
                )}

                {/* Cover badge */}
                {i === 0 && !entry.uploading && !entry.error && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-admin-micro font-semibold uppercase tracking-wider text-paper bg-ink rounded-sm">
                    Cover
                  </div>
                )}

                {/* Move arrows (mobile reorder) */}
                {!entry.uploading && entries.length > 1 && (
                  <div className="absolute bottom-1 left-1 flex gap-0.5">
                    {i > 0 && (
                      <button type="button" onClick={() => moveUp(i)}
                        className="w-5 h-5 rounded-sm flex items-center justify-center bg-ink/55">
                        <ChevronUp className="w-3 h-3 text-paper" />
                      </button>
                    )}
                    {i < entries.length - 1 && (
                      <button type="button" onClick={() => moveDown(i)}
                        className="w-5 h-5 rounded-sm flex items-center justify-center bg-ink/55">
                        <ChevronDown className="w-3 h-3 text-paper" />
                      </button>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {!entry.uploading && (
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    {!entry.error && (
                      <button type="button"
                        onClick={() => { setCropIdx(i); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                        className="w-6 h-6 rounded-sm flex items-center justify-center bg-ink/70 hover:bg-ink transition-colors duration-admin-fast">
                        <Crop className="w-3 h-3 text-paper" />
                      </button>
                    )}
                    <button type="button" onClick={() => remove(i)}
                      className="w-6 h-6 rounded-sm flex items-center justify-center bg-state-error hover:bg-state-error/85 transition-colors duration-admin-fast">
                      <X className="w-3 h-3 text-paper" />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60">
          <div className="rounded-md overflow-hidden w-full max-w-sm shadow-lg bg-paper">
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
                <span className="text-admin-sm font-medium text-ink-3">Zoom</span>
                <input type="range" min={1} max={3} step={0.01} value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="flex-1 accent-ink" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCropIdx(null)}
                  className="flex-1 py-2.5 text-admin font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                  Cancel
                </button>
                <button type="button" onClick={applyCrop}
                  className="flex-1 py-2.5 text-admin font-medium rounded-md bg-ink text-paper hover:bg-ink-2 transition-colors duration-admin-fast">
                  Apply crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
