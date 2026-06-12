"use client";

import { useState, useRef } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { PageContent } from "@/components/ui/PageContent";
import { FileText, Save, Check, ExternalLink, Eye, Edit3, Type, List } from "lucide-react";

type PageDef = { slug: string; title: string; content: string };

function insertAtCursor(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  before: string,
  after = "",
  setValue: (v: string) => void,
) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = el.value.slice(start, end);
  const replacement = before + (selected || "text") + after;
  const next = el.value.slice(0, start) + replacement + el.value.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + before.length, start + before.length + (selected || "text").length);
  });
}

function insertLinePrefix(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  prefix: string,
  setValue: (v: string) => void,
) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const lineStart = el.value.lastIndexOf("\n", start - 1) + 1;
  const next = el.value.slice(0, lineStart) + prefix + el.value.slice(lineStart);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + prefix.length, start + prefix.length);
  });
}

export default function AdminContentClient({ pages }: { pages: PageDef[] }) {
  const [active, setActive] = useState(pages[0]?.slug ?? "");
  const [contents, setContents] = useState<Record<string, string>>(
    Object.fromEntries(pages.map(p => [p.slug, p.content]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const activePage = pages.find(p => p.slug === active);
  const activeContent = contents[active] ?? "";

  function setContent(val: string) {
    setContents(prev => ({ ...prev, [active]: val }));
  }

  async function handleSave() {
    if (!active) return;
    setSaving(true);
    setSaveError("");
    const res = await fetch(`/api/admin/content/${active}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: activeContent }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setSaveError("Save failed — run migration 009 in Supabase first.");
    }
  }

  const wordCount = activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0;

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
              <button key={p.slug}
                onClick={() => { setActive(p.slug); setMode("edit"); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors"
                style={{
                  borderBottom: i < pages.length - 1 ? `1px solid ${BRAND.border}` : "none",
                  background: active === p.slug ? `${BRAND.teal}10` : "transparent",
                  color: active === p.slug ? BRAND.teal : BRAND.black,
                  borderLeft: active === p.slug ? `3px solid ${BRAND.teal}` : "3px solid transparent",
                  fontWeight: active === p.slug ? 600 : 400,
                }}>
                <FileText className="w-3.5 h-3.5 shrink-0 opacity-50" />
                <span className="truncate text-xs">{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {activePage && (
            <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>

              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap"
                style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.bg }}>

                {/* Format buttons */}
                <div className="flex items-center gap-1">
                  <button onClick={() => insertLinePrefix(taRef, "## ", setContent)}
                    title="Heading"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded transition-colors hover:bg-black/[0.06]"
                    style={{ color: BRAND.muted }}>
                    <Type className="w-3.5 h-3.5" /> H
                  </button>
                  <button onClick={() => insertAtCursor(taRef, "**", "**", setContent)}
                    title="Bold"
                    className="px-2.5 py-1.5 text-xs font-black rounded transition-colors hover:bg-black/[0.06]"
                    style={{ color: BRAND.muted }}>
                    B
                  </button>
                  <button onClick={() => insertAtCursor(taRef, "_", "_", setContent)}
                    title="Italic"
                    className="px-2.5 py-1.5 text-xs italic rounded transition-colors hover:bg-black/[0.06]"
                    style={{ color: BRAND.muted }}>
                    I
                  </button>
                  <button onClick={() => insertLinePrefix(taRef, "- ", setContent)}
                    title="Bullet list"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded transition-colors hover:bg-black/[0.06]"
                    style={{ color: BRAND.muted }}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 mx-1" style={{ background: BRAND.border }} />
                  <span className="text-[10px]" style={{ color: BRAND.mutedLight }}>{wordCount} words</span>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  {/* Edit / Preview toggle */}
                  <div className="flex rounded overflow-hidden" style={{ border: `1px solid ${BRAND.border}` }}>
                    <button onClick={() => setMode("edit")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs transition-colors"
                      style={{
                        background: mode === "edit" ? BRAND.black : "transparent",
                        color: mode === "edit" ? "#fff" : BRAND.muted,
                      }}>
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => setMode("preview")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs transition-colors"
                      style={{
                        background: mode === "preview" ? BRAND.black : "transparent",
                        color: mode === "preview" ? "#fff" : BRAND.muted,
                      }}>
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>

                  <a href={`/${active}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                    style={{ color: BRAND.teal }}>
                    <ExternalLink className="w-3 h-3" /> View
                  </a>

                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50"
                    style={{ background: saved ? "#10B981" : BRAND.teal, color: "#fff" }}>
                    {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                    {saving ? "Saving…" : saved ? "Saved!" : "Save"}
                  </button>
                </div>
              </div>

              {/* Page title bar */}
              <div className="px-5 py-3 flex items-center gap-2"
                style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <span className="text-xs font-semibold" style={{ color: BRAND.black }}>{activePage.title}</span>
                <span className="text-xs" style={{ color: BRAND.mutedLight }}>· /{active}</span>
              </div>

              {saveError && (
                <div className="px-5 py-3 text-xs font-semibold"
                  style={{ background: "#FEF2F2", color: "#DC2626", borderBottom: `1px solid #FCA5A5` }}>
                  {saveError}
                </div>
              )}

              {/* Edit pane */}
              {mode === "edit" && (
                <div className="p-4">
                  <textarea
                    ref={taRef}
                    value={activeContent}
                    onChange={e => setContent(e.target.value)}
                    rows={26}
                    spellCheck
                    className="w-full px-4 py-3 text-sm focus:outline-none resize-y"
                    style={{
                      background: BRAND.bg,
                      border: `1px solid ${BRAND.border}`,
                      color: BRAND.black,
                      lineHeight: 1.8,
                      fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                      fontSize: "12.5px",
                    }}
                    placeholder={"## Section Heading\nParagraph text here.\n\n## Another Section\n- Bullet one\n- Bullet two"}
                  />
                  <p className="mt-2 text-[10px]" style={{ color: BRAND.mutedLight }}>
                    <code>## Heading</code> &nbsp;·&nbsp; blank line between paragraphs &nbsp;·&nbsp; <code>- item</code> for bullets
                  </p>
                </div>
              )}

              {/* Preview pane */}
              {mode === "preview" && (
                <div className="p-8">
                  {activeContent.trim() ? (
                    <PageContent text={activeContent} />
                  ) : (
                    <p className="text-sm text-center py-12" style={{ color: BRAND.mutedLight }}>
                      Nothing to preview yet — switch to Edit and add some content.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
