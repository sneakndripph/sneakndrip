"use client";

import { useState, useRef, useEffect } from "react";
import { PageContent } from "@/components/ui/PageContent";
import {
  FileText, Save, Check, ExternalLink, Eye, Edit3, List,
  Underline, Strikethrough, AlignCenter, AlignRight, AlignLeft,
  ChevronDown,
} from "lucide-react";

type PageDef = { slug: string; title: string; content: string; updatedAt: string | null };

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

function setLineStyle(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  prefix: string,
  setValue: (v: string) => void,
) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const lineStart = el.value.lastIndexOf("\n", start - 1) + 1;
  const rawEnd = el.value.indexOf("\n", start);
  const lineEnd = rawEnd === -1 ? el.value.length : rawEnd;
  const currentLine = el.value.slice(lineStart, lineEnd);
  // Strip any existing heading prefix
  const stripped = currentLine
    .replace(/^# /, "").replace(/^### /, "").replace(/^## /, "");
  const newLine = prefix + stripped;
  const next = el.value.slice(0, lineStart) + newLine + el.value.slice(lineEnd);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(lineStart + prefix.length, lineStart + newLine.length);
  });
}

function toggleLineAlign(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  tag: string,
  setValue: (v: string) => void,
) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart;
  const lineStart = el.value.lastIndexOf("\n", start - 1) + 1;
  const rawEnd = el.value.indexOf("\n", start);
  const lineEnd = rawEnd === -1 ? el.value.length : rawEnd;
  const line = el.value.slice(lineStart, lineEnd);
  let newLine: string;
  if (line.startsWith(tag)) {
    newLine = line.slice(tag.length).trimStart();
  } else {
    const cleaned = line.replace(/^\[center\] /, "").replace(/^\[right\] /, "");
    newLine = `${tag} ${cleaned}`;
  }
  const next = el.value.slice(0, lineStart) + newLine + el.value.slice(lineEnd);
  setValue(next);
  requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start, start); });
}

const STYLE_OPTIONS = [
  { label: "Normal",       prefix: "" },
  { label: "Big Heading",  prefix: "# " },
  { label: "Sub-heading",  prefix: "### " },
  { label: "Section Label",prefix: "## " },
] as const;

export default function AdminContentClient({ pages }: { pages: PageDef[] }) {
  const [active, setActive] = useState(pages[0]?.slug ?? "");
  const [contents, setContents] = useState<Record<string, string>>(
    Object.fromEntries(pages.map(p => [p.slug, p.content]))
  );
  const [lastSaved, setLastSaved] = useState<Record<string, string | null>>(
    Object.fromEntries(pages.map(p => [p.slug, p.updatedAt]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [styleOpen, setStyleOpen] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (styleRef.current && !styleRef.current.contains(e.target as Node)) setStyleOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
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
      setLastSaved(prev => ({ ...prev, [active]: new Date().toISOString() }));
      setTimeout(() => setSaved(false), 2500);
    } else {
      setSaveError("Save failed — run migration 009 in Supabase first.");
    }
  }

  const wordCount = activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0;
  const activeLastSaved = lastSaved[active];

  const btnCls = "flex items-center gap-1 px-2 py-1.5 text-admin-sm rounded transition-colors duration-admin-fast hover:bg-admin-row-hover text-ink-3";

  return (
    <div>
      <div className="mb-6">
        <p className="text-admin-eyebrow text-ink-3 mb-1">Content management</p>
        <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Pages</h1>
        <p className="text-admin-sm text-ink-3 mt-1">Edit the text shown on your store&apos;s info pages.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Page list */}
        <div className="lg:col-span-1">
          <div className="bg-paper border border-line rounded-md overflow-hidden">
            {pages.map(p => (
              <button key={p.slug}
                onClick={() => { setActive(p.slug); setMode("edit"); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-line last:border-b-0 transition-colors duration-admin-fast ${
                  active === p.slug ? "bg-admin-row-hover border-l-2 border-l-ink text-ink font-medium" : "border-l-2 border-l-transparent text-ink-2 hover:bg-admin-row-hover"
                }`}>
                <FileText className="w-3.5 h-3.5 shrink-0 text-ink-3" />
                <span className="truncate text-admin-sm">{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {activePage && (
            <div className="bg-paper border border-line rounded-md overflow-hidden">

              {/* Toolbar */}
              <div className="px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper-2">

                <div className="flex flex-wrap items-center gap-0.5">
                  {/* Paragraph style */}
                  <div className="relative mr-1" ref={styleRef}>
                    <button type="button" onClick={() => setStyleOpen(o => !o)}
                      className={`flex items-center gap-1.5 text-admin-sm px-2 py-1.5 rounded focus:outline-none transition-colors duration-admin-fast hover:bg-admin-row-hover text-ink-3 border ${
                        styleOpen ? "border-line-strong" : "border-line"
                      }`}>
                      Style
                      <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-admin-fast ${styleOpen ? "rotate-180" : ""}`} />
                    </button>
                    {styleOpen && (
                      <div className="absolute left-0 top-full mt-1 z-50 overflow-hidden rounded-md border border-line bg-paper shadow-lg min-w-[130px]">
                        {STYLE_OPTIONS.map(o => (
                          <button key={o.label} type="button"
                            onClick={() => { setLineStyle(taRef, o.prefix, setContent); setStyleOpen(false); }}
                            className="w-full px-3 py-2 text-admin-sm text-left border-b border-line last:border-b-0 text-ink hover:bg-admin-row-hover transition-colors duration-admin-fast">
                            {o.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-px h-4 mx-0.5 bg-line" />

                  {/* Inline format */}
                  <button onClick={() => insertAtCursor(taRef, "**", "**", setContent)} title="Bold"
                    className={`${btnCls} font-bold`}>B</button>
                  <button onClick={() => insertAtCursor(taRef, "_", "_", setContent)} title="Italic"
                    className={`${btnCls} italic`}>I</button>
                  <button onClick={() => insertAtCursor(taRef, "__", "__", setContent)} title="Underline"
                    className={btnCls}>
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => insertAtCursor(taRef, "~~", "~~", setContent)} title="Strikethrough"
                    className={btnCls}>
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-4 mx-0.5 bg-line" />

                  {/* Bullet */}
                  <button onClick={() => {
                    const el = taRef.current; if (!el) return;
                    const s = el.selectionStart;
                    const ls = el.value.lastIndexOf("\n", s - 1) + 1;
                    const next = el.value.slice(0, ls) + "- " + el.value.slice(ls);
                    setContent(next);
                    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + 2, s + 2); });
                  }} title="Bullet list" className={btnCls}>
                    <List className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-4 mx-0.5 bg-line" />

                  {/* Alignment */}
                  <button onClick={() => toggleLineAlign(taRef, "[center]", setContent)} title="Center"
                    className={btnCls}>
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleLineAlign(taRef, "[right]", setContent)} title="Right"
                    className={btnCls}>
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleLineAlign(taRef, "", setContent)} title="Left (default)"
                    className={btnCls}>
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-4 mx-0.5 bg-line" />
                  <span className="text-admin-micro ml-1 text-ink-3">{wordCount} words</span>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <div className="flex rounded overflow-hidden border border-line">
                    <button onClick={() => setMode("edit")}
                      className={`flex items-center gap-1 px-3 py-1.5 text-admin-sm transition-colors duration-admin-fast ${
                        mode === "edit" ? "bg-ink text-paper" : "text-ink-3 hover:bg-admin-row-hover"
                      }`}>
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => setMode("preview")}
                      className={`flex items-center gap-1 px-3 py-1.5 text-admin-sm transition-colors duration-admin-fast ${
                        mode === "preview" ? "bg-ink text-paper" : "text-ink-3 hover:bg-admin-row-hover"
                      }`}>
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>

                  <a href={`/${active}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-admin-sm text-ink-2 hover:text-ink transition-colors duration-admin-fast">
                    <ExternalLink className="w-3 h-3" /> View
                  </a>

                  <button onClick={handleSave} disabled={saving}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-admin-sm font-medium rounded transition-colors duration-admin-fast disabled:opacity-50 ${
                      saved ? "bg-state-onhand text-paper" : "bg-ink text-paper hover:opacity-90"
                    }`}>
                    {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                    {saving ? "Saving…" : saved ? "Saved!" : "Save"}
                  </button>
                </div>
              </div>

              {/* Page title bar */}
              <div className="px-5 py-3 flex items-center gap-2 border-b border-line flex-wrap">
                <span className="text-admin-sm font-semibold text-ink">{activePage.title}</span>
                <span className="text-admin-sm text-ink-3">· /{active}</span>
                <span className="text-admin-micro text-ink-3 ml-auto">
                  {activeLastSaved
                    ? `Last saved ${new Date(activeLastSaved).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : "Not yet saved"}
                </span>
              </div>

              {saveError && (
                <div className="px-5 py-3 text-admin-sm font-medium bg-state-error/10 text-state-error border-b border-state-error/30">
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
                    className="w-full px-3.5 py-3 text-admin-sm bg-paper-2 border border-line rounded-md text-ink focus:outline-none focus:border-line-strong transition-colors duration-admin-fast resize-y"
                    style={{ lineHeight: 1.8, fontFamily: "ui-monospace, 'Cascadia Code', monospace", fontSize: "12.5px" }}
                    placeholder={"# Big Heading\n\n### Sub-heading\n\n## SECTION LABEL\n\nParagraph text. **Bold**, _italic_, __underline__, ~~strike~~.\n\n- Bullet one\n- Bullet two\n\n[center] Centered text"}
                  />
                  <p className="mt-2 text-admin-micro text-ink-3">
                    <code># H1</code> &nbsp;·&nbsp;
                    <code>### Sub</code> &nbsp;·&nbsp;
                    <code>## label</code> &nbsp;·&nbsp;
                    <code>**bold**</code> &nbsp;·&nbsp;
                    <code>_italic_</code> &nbsp;·&nbsp;
                    <code>__underline__</code> &nbsp;·&nbsp;
                    <code>~~strike~~</code> &nbsp;·&nbsp;
                    <code>- bullet</code> &nbsp;·&nbsp;
                    <code>[center]</code> or <code>[right]</code> at line start
                  </p>
                </div>
              )}

              {/* Preview pane */}
              {mode === "preview" && (
                <div className="p-8">
                  {activeContent.trim() ? (
                    <PageContent text={activeContent} />
                  ) : (
                    <p className="text-admin-sm text-center py-12 text-ink-3">
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
