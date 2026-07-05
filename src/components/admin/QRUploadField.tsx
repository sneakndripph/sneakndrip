"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { BRAND } from "@/lib/constants";
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
      <label className="block text-xs font-bold uppercase tracking-wide mb-2"
        style={{ color: BRAND.black }}>{label}</label>

      {value ? (
        <div className="flex items-start gap-4">
          {/* QR preview */}
          <div className="rounded-xl overflow-hidden flex-shrink-0"
            style={{ width: 160, height: 160, border: `1px solid ${BRAND.border}`, background: "#fff" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="w-full h-full object-contain p-2" />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button type="button" onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-opacity"
              style={{ background: BRAND.teal, color: "#fff", opacity: uploading ? 0.6 : 1 }}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button type="button" onClick={() => onChange("")}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg"
              style={{ background: `${BRAND.red}15`, color: BRAND.red }}>
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed transition-colors"
          style={{ borderColor: BRAND.border, opacity: uploading ? 0.6 : 1 }}>
          {uploading
            ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND.teal }} />
            : <Upload className="w-5 h-5" style={{ color: BRAND.mutedLight }} />}
          <span className="text-sm font-semibold" style={{ color: BRAND.black }}>
            {uploading ? "Uploading…" : "Upload QR Code"}
          </span>
          <span className="text-xs" style={{ color: BRAND.muted }}>PNG or JPG from your GCash / Maya app</span>
        </button>
      )}

      {error && (
        <p className="text-xs mt-1.5" style={{ color: BRAND.red }}>Upload failed: {error}</p>
      )}

      <input ref={inputRef} type="file" accept="image/*,.jpg,.jpeg,.png" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );
}
