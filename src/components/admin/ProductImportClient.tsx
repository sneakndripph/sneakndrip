"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Download, Upload, Loader2, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { BRANDS } from "@/lib/constants";
import {
  buildImport, templateCSV, IMPORT_CHUNK_SIZE, MAX_IMPORT_BYTES,
  type ImportGroup, type ParseResult,
} from "@/lib/products/csv-import";
import { useConfirmDialog } from "./ConfirmDialog";

type Existing = { id: string; name: string; sku: string };
type Action = "create" | "update" | "skip";
type Edit = { brand?: string; price?: string; action?: Action };

type Resolved = {
  g: ImportGroup;
  existing: Existing | undefined;
  brand: string;
  price: number | null;
  action: Action;
  problems: string[];
  warnings: string[];
};

type Report = {
  created: number; updated: number;
  skipped: { key: string; reason: string }[];
  errors: { key: string; message: string }[];
};

function downloadCSV(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function ProductImportClient({ existing }: { existing: Existing[] }) {
  const existingBySku = useMemo(
    () => new Map(existing.map(e => [e.sku.trim().toUpperCase(), e])),
    [existing],
  );
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { confirm, dialog } = useConfirmDialog();

  function reset() {
    setParsed(null); setEdits({}); setReport(null); setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) { toast.error("Choose a .csv file (in Excel: File → Save As → CSV)"); return; }
    if (file.size > MAX_IMPORT_BYTES) { toast.error("File is larger than 5MB"); return; }
    setParsing(true); setReport(null); setEdits({});
    try {
      const Papa = (await import("papaparse")).default;
      const res = await new Promise<{ fields: string[]; data: Record<string, string>[] }>((resolve, reject) => {
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: "greedy",
          complete: r => resolve({ fields: r.meta.fields ?? [], data: r.data }),
          error: err => reject(err),
        });
      });
      setFileName(file.name);
      setParsed(buildImport(res.fields, res.data));
    } catch (err) {
      toast.error(`Couldn't read the CSV: ${String(err)}`);
    } finally {
      setParsing(false);
    }
  }

  function setEdit(key: string, patch: Edit) {
    setEdits(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  const resolved: Resolved[] = useMemo(() => (parsed?.groups ?? []).map(g => {
    const e = edits[g.key] ?? {};
    const match = g.sku ? existingBySku.get(g.sku) : undefined;
    const brand = (e.brand ?? g.brand ?? "").trim();
    const priceStr = e.price ?? (g.price !== null ? String(g.price) : "");
    const priceNum = Number(priceStr);
    const price = priceStr && Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null;

    const action: Action = match ? (e.action ?? "skip") : g.stock === 0 ? "skip" : "create";
    const problems = [...g.errors];
    if (action === "create") {
      if (!brand) problems.push("Brand needed");
      if (price === null) problems.push("Price needed");
    }
    const warnings: string[] = [];
    if (!g.sku) warnings.push("No SKU — importing this file again will create a duplicate");
    if (g.costsVary) warnings.push("Costs vary — using the average");
    if (action === "create" && g.brandSource === "detected" && !e.brand) warnings.push("Brand detected from name");
    if (action === "create" && g.priceSource === "sold" && !e.price) warnings.push("Price taken from last sale — check it");
    return { g, existing: match, brand, price, action, problems, warnings };
  }), [parsed, edits, existingBySku]);

  const ready = resolved.filter(r => r.action !== "skip" && r.problems.length === 0);
  const blocked = resolved.filter(r => r.action !== "skip" && r.problems.length > 0);
  const toUpdate = ready.filter(r => r.action === "update");
  const pairsInStock = resolved.reduce((s, r) => s + r.g.stock, 0);

  async function runImport() {
    if (!ready.length || progress) return;
    if (toUpdate.length) {
      const ok = await confirm({
        title: `Import ${ready.length} product${ready.length !== 1 ? "s" : ""}?`,
        description: `${toUpdate.length} existing product${toUpdate.length !== 1 ? "s" : ""} will have stock replaced with the counts from this file (sizes not in the file are left alone). New products are created as drafts.`,
        confirmLabel: "Import",
      });
      if (!ok) return;
    }
    const payload = ready.map(r => r.action === "update"
      ? { key: r.g.key, mode: "update" as const, name: r.g.name, sku: r.g.sku!, gender: r.g.gender, sizes: r.g.sizes }
      : {
          key: r.g.key, mode: "create" as const, name: r.g.name, sku: r.g.sku, gender: r.g.gender,
          brand: r.brand, price: r.price!, cost: r.g.cost, sizes: r.g.sizes,
        });

    const total: Report = { created: 0, updated: 0, skipped: [], errors: [] };
    setProgress({ done: 0, total: payload.length });
    for (let i = 0; i < payload.length; i += IMPORT_CHUNK_SIZE) {
      const chunk = payload.slice(i, i + IMPORT_CHUNK_SIZE);
      try {
        const res = await fetch("/api/admin/products/import", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products: chunk }),
        });
        const data = await res.json().catch(() => ({})) as Partial<Report> & { error?: string };
        if (!res.ok) {
          for (const p of chunk) total.errors.push({ key: p.key, message: data.error ?? `Request failed (${res.status})` });
        } else {
          total.created += data.created ?? 0;
          total.updated += data.updated ?? 0;
          total.skipped.push(...(data.skipped ?? []));
          total.errors.push(...(data.errors ?? []));
        }
      } catch (err) {
        for (const p of chunk) total.errors.push({ key: p.key, message: String(err) });
      }
      setProgress({ done: Math.min(i + chunk.length, payload.length), total: payload.length });
    }
    setProgress(null);
    setReport(total);
    if (total.errors.length) toast.error(`${total.errors.length} product${total.errors.length !== 1 ? "s" : ""} failed to import`);
    else toast.success("Import finished");
  }

  const nameByKey = new Map(resolved.map(r => [r.g.key, r.g.name]));

  return (
    <div>
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-admin-sm text-ink-3 hover:text-ink mb-4 transition-colors duration-admin-fast">
        <ArrowLeft className="w-3.5 h-3.5" /> Products
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Import CSV</h1>
          <p className="text-admin text-ink-3 mt-1">Create draft products and set stock from your inventory sheet.</p>
        </div>
        <button type="button" onClick={() => downloadCSV("sneakndrip-inventory-template.csv", templateCSV())}
          className="flex items-center gap-1.5 px-3 py-2 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
          <Download className="w-3.5 h-3.5" /> Download template
        </button>
      </div>

      {/* Report */}
      {report && (
        <div className="bg-paper border border-line rounded-md p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-state-onhand" />
            <p className="text-admin-title text-ink">Import finished</p>
          </div>
          <p className="text-admin-sm text-ink-2">
            {report.created} created as drafts · {report.updated} stock updated · {report.skipped.length} skipped · {report.errors.length} failed
          </p>
          {report.skipped.length + report.errors.length > 0 && (
            <ul className="mt-3 space-y-1 max-h-48 overflow-y-auto">
              {report.skipped.map(s => (
                <li key={`s-${s.key}`} className="text-admin-micro text-ink-3">{nameByKey.get(s.key) ?? s.key}: {s.reason}</li>
              ))}
              {report.errors.map(e => (
                <li key={`e-${e.key}`} className="text-admin-micro text-state-error">{nameByKey.get(e.key) ?? e.key}: {e.message}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 mt-4">
            <Link href="/admin/products" className="bg-ink text-paper text-admin px-4 py-2 rounded-md hover:bg-ink-2 transition-colors duration-admin-fast">
              View products
            </Link>
            <button type="button" onClick={reset}
              className="text-admin px-4 py-2 rounded-md border border-ink text-ink hover:bg-ink hover:text-paper transition-colors duration-admin-fast">
              Import another file
            </button>
          </div>
        </div>
      )}

      {/* Upload */}
      {!parsed && !report && (
        <label className={`block bg-paper border border-dashed border-line-strong rounded-md px-6 py-12 text-center cursor-pointer hover:bg-paper-2 transition-colors duration-admin-fast ${parsing ? "opacity-60 pointer-events-none" : ""}`}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); void handleFile(e.dataTransfer.files[0]); }}>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only"
            onChange={e => void handleFile(e.target.files?.[0])} />
          {parsing ? <Loader2 className="w-7 h-7 mx-auto mb-3 text-ink-3 animate-spin" /> : <Upload className="w-7 h-7 mx-auto mb-3 text-ink-3" />}
          <p className="text-admin-title text-ink">{parsing ? "Reading file…" : "Choose a CSV file or drop it here"}</p>
          <p className="text-admin-sm text-ink-3 mt-2 max-w-lg mx-auto">
            Up to 5MB, one row per pair. <span className="text-ink-2">Name</span> and <span className="text-ink-2">Size</span> are required;
            SKU, Gender, Cost, Gross, Brand and Price are optional. Rows with <span className="text-ink-2">Gross</span> filled count as sold
            and aren&apos;t added to stock. Images are added later from each product&apos;s edit page.
          </p>
        </label>
      )}

      {/* Missing required columns */}
      {parsed && !report && parsed.missingColumns.length > 0 && (
        <div className="bg-paper border border-line rounded-md p-6">
          <p className="flex items-center gap-2 text-admin-title text-state-error">
            <AlertTriangle className="w-4 h-4" /> Missing column{parsed.missingColumns.length !== 1 ? "s" : ""}: {parsed.missingColumns.join(", ")}
          </p>
          <p className="text-admin-sm text-ink-3 mt-2">Check the header row in {fileName}, or start from the template.</p>
          <button type="button" onClick={reset}
            className="mt-4 text-admin px-4 py-2 rounded-md border border-ink text-ink hover:bg-ink hover:text-paper transition-colors duration-admin-fast">
            Choose another file
          </button>
        </div>
      )}

      {/* Preview */}
      {parsed && !report && parsed.missingColumns.length === 0 && (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 text-admin-sm text-ink-2">
            <span className="flex items-center gap-1.5 text-ink font-medium"><FileText className="w-3.5 h-3.5 text-ink-3" />{fileName}</span>
            <span>{resolved.length} product{resolved.length !== 1 ? "s" : ""}</span>
            <span>{pairsInStock} pair{pairsInStock !== 1 ? "s" : ""} in stock</span>
            <span>{parsed.soldRows} sold row{parsed.soldRows !== 1 ? "s" : ""} ignored</span>
            {parsed.rowErrors.length > 0 && <span className="text-state-error">{parsed.rowErrors.length} invalid row{parsed.rowErrors.length !== 1 ? "s" : ""}</span>}
            {parsed.unknownColumns.length > 0 && <span className="text-ink-3">Ignored columns: {parsed.unknownColumns.join(", ")}</span>}
          </div>

          {parsed.rowErrors.length > 0 && (
            <details className="bg-paper border border-line rounded-md mb-4">
              <summary className="px-4 py-3 text-admin-sm text-state-error cursor-pointer">
                {parsed.rowErrors.length} row{parsed.rowErrors.length !== 1 ? "s" : ""} will be skipped
              </summary>
              <ul className="px-4 pb-3 space-y-1 max-h-48 overflow-y-auto">
                {parsed.rowErrors.map(e => (
                  <li key={e.row} className="text-admin-micro text-ink-2">Row {e.row}: {e.message}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="bg-paper border border-line rounded-md overflow-x-auto mb-24">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-paper-2 border-b border-line-strong">
                  {["Product", "Brand", "Price", "Cost", "Sizes", "Stock", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {resolved.map(r => {
                  const { g } = r;
                  const editable = r.action === "create";
                  return (
                    <tr key={g.key} className={`align-top ${r.action === "skip" ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 max-w-[260px]">
                        <p className="text-admin-sm font-semibold text-ink">{g.name}</p>
                        <p className="text-admin-micro text-ink-3">{g.sku ?? "No SKU"} · {g.gender} · rows {g.rows[0]}{g.rows.length > 1 ? `–${g.rows[g.rows.length - 1]}` : ""}</p>
                        {r.problems.map(p => <p key={p} className="text-admin-micro text-state-error mt-1">{p}</p>)}
                        {r.warnings.map(w => <p key={w} className="text-admin-micro text-state-preorder mt-1">{w}</p>)}
                      </td>
                      <td className="px-4 py-3">
                        {editable ? (
                          <select value={r.brand} onChange={e => setEdit(g.key, { brand: e.target.value })}
                            className={`text-admin-sm bg-paper border rounded-md px-2 py-1.5 text-ink ${r.brand ? "border-line" : "border-state-error"}`}>
                            <option value="">Choose…</option>
                            {r.brand && !(BRANDS as string[]).includes(r.brand) && <option value={r.brand}>{r.brand}</option>}
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        ) : <span className="text-admin-sm text-ink-3">{r.existing ? "—" : r.brand || "—"}</span>}
                      </td>
                      <td className="px-4 py-3">
                        {editable ? (
                          <div className="flex items-center gap-1">
                            <span className="text-admin-sm text-ink-3">₱</span>
                            <input type="number" min={1} inputMode="decimal"
                              value={edits[g.key]?.price ?? (g.price ?? "")}
                              onChange={e => setEdit(g.key, { price: e.target.value })}
                              className={`w-24 text-admin-sm bg-paper border rounded-md px-2 py-1.5 text-ink ${r.price !== null ? "border-line" : "border-state-error"}`} />
                          </div>
                        ) : <span className="text-admin-sm text-ink-3">—</span>}
                      </td>
                      <td className="px-4 py-3 text-admin-sm text-ink-2 whitespace-nowrap">
                        {g.cost !== null ? `₱${g.cost.toLocaleString()}` : "—"}
                        {g.costsVary && <span className="block text-admin-micro text-ink-3">avg, costs vary</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {g.sizes.map(s => (
                            <span key={s.size} className={`text-admin-micro px-1.5 py-0.5 rounded border border-line ${s.stock > 0 ? "text-ink" : "text-ink-3 line-through"}`}>
                              {s.size} ×{s.stock}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-admin-sm text-ink">
                        {g.stock}
                        {g.soldRows > 0 && <span className="block text-admin-micro text-ink-3">{g.soldRows} sold</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.existing ? (
                          <div>
                            <select value={r.action} onChange={e => setEdit(g.key, { action: e.target.value as Action })}
                              className="text-admin-sm bg-paper border border-line rounded-md px-2 py-1.5 text-ink">
                              <option value="skip">Skip</option>
                              <option value="update">Update stock</option>
                            </select>
                            <Link href={`/admin/products/${r.existing.id}`} target="_blank"
                              className="block text-admin-micro text-ink-3 hover:text-ink mt-1 underline underline-offset-2">
                              Exists: {r.existing.name}
                            </Link>
                          </div>
                        ) : g.stock === 0 ? (
                          <span className="text-admin-micro text-ink-3">All sold — skipped</span>
                        ) : r.problems.length ? (
                          <span className="text-admin-eyebrow text-state-error">Needs fixing</span>
                        ) : (
                          <span className="text-admin-eyebrow text-state-onhand">New draft</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sticky import bar */}
          <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 z-30 flex flex-wrap items-center gap-3 px-4 py-3 bg-ink text-paper md:rounded-md shadow-lg">
            <span className="text-admin-sm">
              {progress
                ? `Importing ${progress.done}/${progress.total}…`
                : `${ready.length} ready${blocked.length ? ` · ${blocked.length} need fixing (left out)` : ""}`}
            </span>
            <button type="button" onClick={reset} disabled={!!progress}
              className="text-admin-sm px-2 py-1.5 opacity-80 hover:opacity-100 transition-opacity duration-admin-fast disabled:opacity-40">
              Choose another file
            </button>
            <button type="button" onClick={runImport} disabled={!ready.length || !!progress}
              className="flex items-center gap-1.5 text-admin-sm px-3 py-1.5 rounded-md bg-paper text-ink hover:bg-paper-2 transition-colors duration-admin-fast disabled:opacity-50 disabled:cursor-not-allowed">
              {progress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Import {ready.length} product{ready.length !== 1 ? "s" : ""}
            </button>
          </div>
        </>
      )}
      {dialog}
    </div>
  );
}
