"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

async function uploadQR(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `qr/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("product-images").getPublicUrl(data.path).data.publicUrl;
}

export default function QRUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadQR(file);
      onChange(url);
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-admin-eyebrow text-ink-3 mb-2">{label}</label>

      {value ? (
        <div className="flex items-start gap-4">
          <div className="w-[160px] h-[160px] shrink-0 rounded-md overflow-hidden border border-line bg-paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="w-full h-full object-contain p-2" />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 text-admin-sm font-medium rounded-md bg-ink text-paper hover:bg-ink-2 disabled:opacity-60 transition-colors duration-admin-fast">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button type="button" onClick={() => onChange("")}
              className="flex items-center gap-2 px-3 py-2 text-admin-sm font-medium rounded-md border border-state-error/30 text-state-error hover:bg-state-error/10 transition-colors duration-admin-fast">
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-md border-2 border-dashed border-line hover:border-ink-3 disabled:opacity-60 transition-colors duration-admin-fast">
          {uploading
            ? <Loader2 className="w-5 h-5 text-ink-3 animate-spin" />
            : <Upload className="w-5 h-5 text-ink-3" />}
          <span className="text-admin font-medium text-ink">
            {uploading ? "Uploading…" : "Upload QR code"}
          </span>
          <span className="text-admin-micro text-ink-3">PNG or JPG from your GCash / Maya app</span>
        </button>
      )}

      {error && (
        <p className="text-admin-micro text-state-error mt-1.5">Upload failed: {error}</p>
      )}

      <input ref={inputRef} type="file" accept="image/*,.jpg,.jpeg,.png" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );
}
