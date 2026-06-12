"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { FileText, Save, Check, ExternalLink } from "lucide-react";

type PageDef = { slug: string; title: string; content: string };

export default function AdminContentClient({ pages }: { pages: PageDef[] }) {
  const [active, setActive] = useState(pages[0]?.slug ?? "");
  const [contents, setContents] = useState<Record<string, string>>(
    Object.fromEntries(pages.map(p => [p.slug, p.content]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const activePage = pages.find(p => p.slug === active);

  async function handleSave() {
    if (!active) return;
    setSaving(true);
    setSaveError("");
    const res = await fetch(`/api/admin/content/${active}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: contents[active] ?? "" }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setSaveError("Save failed — run migration 009 in Supabase first.");
    }
  }

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Content Management</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>PAGES</h1>
        <p className="text-sm mt-1" style={{ color: BRAND.muted }}>Edit the text shown on your store&apos;s info pages.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Page list */}
        <div className="lg:col-span-1">
          <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            {pages.map((p, i) => (
              <button key={p.slug} onClick={() => setActive(p.slug)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-colors"
                style={{
                  borderBottom: i < pages.length - 1 ? `1px solid ${BRAND.border}` : "none",
                  background: active === p.slug ? `${BRAND.teal}10` : "transparent",
                  color: active === p.slug ? BRAND.teal : BRAND.black,
                  borderLeft: active === p.slug ? `3px solid ${BRAND.teal}` : "3px solid transparent",
                }}>
                <FileText className="w-4 h-4 shrink-0 opacity-60" />
                <span className="truncate">{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {activePage && (
            <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <div>
                  <p className="font-black text-sm" style={{ color: BRAND.black }}>{activePage.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs" style={{ color: BRAND.muted }}>Live at</p>
                    <a href={`/${active}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs flex items-center gap-0.5 hover:underline"
                      style={{ color: BRAND.teal }}>
                      /{active} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50"
                  style={{
                    background: saved ? "#10B981" : BRAND.teal,
                    color: "#fff",
                  }}>
                  {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                </button>
              </div>

              {saveError && (
                <div className="px-5 py-3 text-xs font-semibold"
                  style={{ background: "#FEF2F2", color: "#DC2626", borderBottom: `1px solid #FCA5A5` }}>
                  {saveError}
                </div>
              )}

              <div className="p-5">
                <p className="text-xs mb-3 pb-3" style={{ color: BRAND.muted, borderBottom: `1px solid ${BRAND.border}` }}>
                  Formatting: <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: BRAND.bg }}>## Heading</code> · blank line between paragraphs · <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: BRAND.bg }}>- item</code> for bullet lists
                </p>
                <textarea
                  value={contents[active] ?? ""}
                  onChange={e => setContents(prev => ({ ...prev, [active]: e.target.value }))}
                  rows={24}
                  className="w-full px-4 py-3 text-sm focus:outline-none resize-y"
                  style={{
                    background: BRAND.bg,
                    border: `1px solid ${BRAND.border}`,
                    color: BRAND.black,
                    lineHeight: 1.7,
                    fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace",
                    fontSize: "12.5px",
                  }}
                  placeholder="Enter page content here…&#10;&#10;## Section Heading&#10;Paragraph text goes here.&#10;&#10;## Another Section&#10;- Bullet point one&#10;- Bullet point two"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
