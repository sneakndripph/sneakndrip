import { BRANDS } from "@/lib/constants";

/**
 * Inventory CSV import (/admin/products/import). Each CSV row is one physical pair:
 * a row with Gross filled is a sold pair (the red rows in the Excel sheet — colours
 * don't survive CSV export, so Gross is the signal) and is not counted as stock.
 * Rows are grouped into products by SKU, or by Name + Gender when SKU is blank.
 */

export type ImportField = "name" | "sku" | "size" | "gender" | "cost" | "gross" | "net" | "brand" | "price";
export type Gender = "Unisex" | "Men" | "Women" | "Kids";

export const TEMPLATE_HEADERS = ["Name", "SKU", "Size", "Gender", "Cost", "Gross", "Net", "Brand", "Price"];
export const REQUIRED_FIELDS: ImportField[] = ["name", "size"];
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
/** Products per request to POST /api/admin/products/import. */
export const IMPORT_CHUNK_SIZE = 200;

const HEADER_ALIASES: Record<string, ImportField> = {
  "name": "name", "product": "name", "product name": "name", "item": "name",
  "sku": "sku", "style code": "sku", "style": "sku",
  "size": "size",
  "gender": "gender",
  "cost": "cost", "cost price": "cost",
  "gross": "gross", "sold price": "gross", "sold for": "gross",
  "net": "net", "profit": "net",
  "brand": "brand",
  "price": "price", "selling price": "price", "srp": "price",
};

// Longest/most specific first: "Nike Air Jordan 1" is a Jordan, "Yeezy" is an Adidas.
const BRAND_ALIASES: [string, string][] = [
  ["nike air jordan", "Jordan"], ["air jordan", "Jordan"], ["jordan", "Jordan"],
  ["yeezy", "Adidas"], ["adidas", "Adidas"],
  ["new balance", "New Balance"], ["nb", "New Balance"],
  ["on running", "On Running"], ["on cloud", "On Running"],
  ["hoka one one", "Hoka"],
  ...BRANDS.map(b => [b.toLowerCase(), b] as [string, string]),
];

const GENDER_ALIASES: Record<string, Gender> = {
  "MEN": "Men", "MENS": "Men", "MAN": "Men", "M": "Men", "MALE": "Men",
  "WOMEN": "Women", "WOMENS": "Women", "WMNS": "Women", "W": "Women", "WOMAN": "Women", "FEMALE": "Women", "F": "Women",
  "KIDS": "Kids", "KID": "Kids", "K": "Kids", "GS": "Kids", "PS": "Kids", "TD": "Kids", "YOUTH": "Kids",
  "UNISEX": "Unisex", "U": "Unisex", "": "Unisex",
};

export function normalizeHeader(h: string): ImportField | null {
  const key = h.replace(/^﻿/, "").trim().toLowerCase().replace(/\s+/g, " ");
  return HEADER_ALIASES[key] ?? null;
}

/** "₱1,200.00" / "PHP 1200" / "1200" → 1200; blank → null; garbage → NaN. */
export function parseMoney(raw: string | undefined): number | null {
  const s = (raw ?? "").replace(/₱|php/gi, "").replace(/[,\s]/g, "");
  if (!s || s === "-") return null;
  return Number(s);
}

/** Bare numbers become "US 9.5" to match the store's size labels; anything else is kept. */
export function normalizeSize(raw: string): string {
  const s = raw.trim().replace(/\s+/g, " ");
  const m = s.match(/^(?:us\s*)?(\d+(?:\.\d+)?)$/i);
  return m ? `US ${Number(m[1])}` : s;
}

export function normalizeGender(raw: string | undefined): Gender | null {
  const key = (raw ?? "").trim().toUpperCase().replace(/['’.]/g, "");
  return GENDER_ALIASES[key] ?? null;
}

/** Canonical brand for a Brand cell (unknown brands are kept as typed). */
export function canonicalBrand(raw: string): string {
  const s = raw.trim();
  const hit = BRAND_ALIASES.find(([alias]) => alias === s.toLowerCase());
  return hit ? hit[1] : s;
}

/** Brand from the start of a product name, e.g. "Nike Dunk Low" → "Nike". */
export function detectBrand(name: string): string | null {
  const n = name.trim().toLowerCase();
  const hit = BRAND_ALIASES.find(([alias]) => n === alias || n.startsWith(alias + " "));
  return hit ? hit[1] : null;
}

export function toSlug(name: string, salt: string | number) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base}-${Date.now().toString(36)}${String(salt)}`;
}

export type RowError = { row: number; message: string };

export type ImportGroup = {
  key: string;
  name: string;
  sku: string | null;
  gender: Gender;
  brand: string | null;
  brandSource: "column" | "detected" | null;
  price: number | null;
  priceSource: "column" | "sold" | null;
  cost: number | null;
  costsVary: boolean;
  /** Every size seen, including fully sold ones (stock 0). */
  sizes: { size: string; stock: number }[];
  stock: number;
  soldRows: number;
  rows: number[];
  /** Blocking problems from the file itself (not fixable in the preview). */
  errors: string[];
};

export type ParseResult = {
  groups: ImportGroup[];
  rowErrors: RowError[];
  missingColumns: string[];
  unknownColumns: string[];
  totalRows: number;
  soldRows: number;
};

type RowAcc = {
  name: string; sku: string | null; gender: Gender; names: Set<string>; genders: Set<Gender>;
  brandCol: string | null; priceCol: number | null; lastSoldGross: number | null;
  unsoldCosts: number[]; allCosts: number[];
  sizes: Map<string, number>; soldRows: number; rows: number[];
};

/** Turns Papa Parse rows (header: true) into product groups + per-row errors. */
export function buildImport(headers: string[], records: Record<string, string>[]): ParseResult {
  const fieldFor = new Map<string, ImportField>();
  const unknownColumns: string[] = [];
  for (const h of headers) {
    const f = normalizeHeader(h);
    if (f) fieldFor.set(h, f); else if (h.trim()) unknownColumns.push(h);
  }
  const present = new Set(fieldFor.values());
  const missingColumns = REQUIRED_FIELDS.filter(f => !present.has(f)).map(f => f[0].toUpperCase() + f.slice(1));
  if (missingColumns.length) {
    return { groups: [], rowErrors: [], missingColumns, unknownColumns, totalRows: records.length, soldRows: 0 };
  }

  const rowErrors: RowError[] = [];
  const acc = new Map<string, RowAcc>();
  let soldTotal = 0;

  records.forEach((rec, i) => {
    const row = i + 2; // 1-based, after the header row
    const v: Partial<Record<ImportField, string>> = {};
    for (const [h, f] of fieldFor) v[f] = (rec[h] ?? "").trim();
    if (Object.values(v).every(x => !x)) return; // blank line

    const name = (v.name ?? "").replace(/\s+/g, " ");
    if (!name) { rowErrors.push({ row, message: "Missing Name" }); return; }
    if (!v.size) { rowErrors.push({ row, message: `Missing Size for "${name}"` }); return; }
    const gender = normalizeGender(v.gender);
    if (!gender) { rowErrors.push({ row, message: `Unknown Gender "${v.gender}"` }); return; }
    const cost = parseMoney(v.cost), gross = parseMoney(v.gross), price = parseMoney(v.price);
    for (const [label, n] of [["Cost", cost], ["Gross", gross], ["Price", price]] as const) {
      if (n !== null && (!Number.isFinite(n) || n < 0)) {
        rowErrors.push({ row, message: `Invalid ${label} "${v[label.toLowerCase() as ImportField]}"` });
        return;
      }
    }

    const sku = v.sku ? v.sku.toUpperCase() : null;
    const key = sku ? `sku:${sku}` : `name:${name.toLowerCase()}|${gender}`;
    let g = acc.get(key);
    if (!g) {
      g = {
        name, sku, gender, names: new Set(), genders: new Set(), brandCol: null, priceCol: null,
        lastSoldGross: null, unsoldCosts: [], allCosts: [], sizes: new Map(), soldRows: 0, rows: [],
      };
      acc.set(key, g);
    }
    g.names.add(name.toLowerCase());
    g.genders.add(gender);
    g.rows.push(row);
    if (v.brand) g.brandCol = canonicalBrand(v.brand);
    if (price !== null) g.priceCol = price;
    if (cost !== null) g.allCosts.push(cost);

    const size = normalizeSize(v.size);
    const sold = gross !== null && gross > 0;
    if (sold) {
      g.soldRows++; soldTotal++;
      g.lastSoldGross = gross;
      if (!g.sizes.has(size)) g.sizes.set(size, 0);
    } else {
      if (cost !== null) g.unsoldCosts.push(cost);
      g.sizes.set(size, (g.sizes.get(size) ?? 0) + 1);
    }
  });

  const groups: ImportGroup[] = [...acc.entries()].map(([key, g]) => {
    const errors: string[] = [];
    if (g.names.size > 1) errors.push(`SKU ${g.sku} is used with ${g.names.size} different names`);
    if (g.genders.size > 1) errors.push(`SKU ${g.sku} is used with more than one gender`);

    const costs = g.unsoldCosts.length ? g.unsoldCosts : g.allCosts;
    const cost = costs.length ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : null;
    const costsVary = new Set(costs).size > 1;

    const detected = g.brandCol ? null : detectBrand(g.name);
    const brand = g.brandCol ?? detected;
    const price = g.priceCol ?? g.lastSoldGross;

    const sizes = [...g.sizes.entries()]
      .map(([size, stock]) => ({ size, stock }))
      .sort((a, b) => sizeOrder(a.size) - sizeOrder(b.size) || a.size.localeCompare(b.size));

    return {
      key, name: g.name, sku: g.sku, gender: g.gender,
      brand, brandSource: g.brandCol ? "column" : detected ? "detected" : null,
      price, priceSource: g.priceCol !== null ? "column" : g.lastSoldGross !== null ? "sold" : null,
      cost, costsVary, sizes, stock: sizes.reduce((s, x) => s + x.stock, 0),
      soldRows: g.soldRows, rows: g.rows, errors,
    };
  });

  return { groups, rowErrors, missingColumns: [], unknownColumns, totalRows: records.length, soldRows: soldTotal };
}

function sizeOrder(size: string) {
  const m = size.match(/^US (\d+(?:\.\d+)?)$/);
  return m ? Number(m[1]) : 1000;
}

export function templateCSV() {
  const rows = [
    TEMPLATE_HEADERS,
    ["Nike Dunk Low Panda", "DD1391-100", "9.5", "MEN", "4500", "", "", "", ""],
    ["Nike Dunk Low Panda", "DD1391-100", "10", "MEN", "4500", "6500", "2000", "", ""],
    ["Adidas Samba OG", "B75806", "7", "WOMEN", "3800", "", "", "Adidas", "5900"],
  ];
  return rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
}
