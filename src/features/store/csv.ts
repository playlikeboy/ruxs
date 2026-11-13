/**
 * CSV helpers for the RUXs Store seller portal (product import, stock import,
 * product and order export). Pure: no database, no I/O. Money is read and
 * written as rupee text ("349" / "349.50") and converted with integer maths.
 */

/** RFC 4180 parser: quoted cells, doubled quotes, CRLF/LF, a leading BOM. Fully blank lines are dropped. */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endRow = () => {
    row.push(cell);
    cell = "";
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") endRow();
    else if (ch === "\r") {
      if (src[i + 1] === "\n") i++;
      endRow();
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) endRow();
  return rows;
}

/**
 * One CSV cell. Text starting with = + - @ (or tab/CR) gets a leading apostrophe
 * so a spreadsheet never runs it as a formula; numbers pass through untouched.
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "yes" : "no";
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(headers: readonly string[], rows: readonly (readonly (string | number | boolean | null | undefined)[])[]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rows) lines.push(r.map(csvCell).join(","));
  return lines.join("\r\n") + "\r\n";
}

/** "349", "349.5", "₹1,299.00" → paise. Null when it is not a plain rupee amount. Never uses floats. */
export function rupeesTextToPaise(text: string): number | null {
  const v = text.replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(v);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** 34950 → "349.50". */
export function paiseToRupeesText(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function parseCsvBool(text: string): boolean | null {
  const v = text.trim().toLowerCase();
  if (["yes", "y", "true", "1", "on"].includes(v)) return true;
  if (["no", "n", "false", "0", "off"].includes(v)) return false;
  return null;
}

function parseCsvInt(text: string): number | null {
  return /^-?\d{1,9}$/.test(text.trim()) ? Number(text.trim()) : null;
}

/** Cells holding a list use " | " between values. */
function splitList(text: string): string[] {
  return text
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Column order of the product export; the import accepts the same headers in any order. */
export const PRODUCT_CSV_HEADERS = [
  "sku",
  "name",
  "category",
  "price",
  "mrp",
  "stock",
  "low_stock_at",
  "gst_bps",
  "age_min",
  "age_max",
  "brand",
  "tagline",
  "description",
  "skills",
  "box_contents",
  "safety_notes",
  "weight_grams",
  "images",
  "featured",
  "active",
  "slug",
] as const;
export type ProductCsvHeader = (typeof PRODUCT_CSV_HEADERS)[number];

/** Fields one import row sets. A missing key means the cell was blank: keep the saved value (or the default on create). */
export interface ProductImportFields {
  name?: string;
  categoryId?: string;
  pricePaise?: number;
  /** null clears the MRP (cell "-" or "none"). */
  mrpPaise?: number | null;
  /** Opening stock: used only when the SKU is new. */
  stock?: number;
  lowStockAt?: number;
  gstBps?: number;
  ageMin?: number;
  ageMax?: number | null;
  brand?: string;
  tagline?: string;
  description?: string;
  skills?: string[];
  boxContents?: string[];
  safetyNotes?: string;
  weightGrams?: number | null;
  images?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  slug?: string;
}

export interface ProductImportRow {
  /** 1-based line in the CSV (header = 1). */
  line: number;
  sku: string;
  fields: ProductImportFields;
}

export interface CsvRowError {
  line: number;
  sku: string | null;
  message: string;
}

export const STORE_IMPORT_MAX_ROWS = 500;

const CLEAR = new Set(["-", "none", "null"]);

/**
 * Reads the product import CSV into typed rows. Only the shape is checked here
 * (numbers are numbers, yes/no is yes/no, SKUs are unique in the file); the
 * business rules run later through storeProductSchema.
 */
export function parseProductImportCsv(text: string): { rows: ProductImportRow[]; errors: CsvRowError[]; fatal: string | null } {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], errors: [], fatal: "The CSV is empty" };
  const header = table[0]!.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const known = new Set<string>(PRODUCT_CSV_HEADERS);
  const unknown = header.filter((h) => h && !known.has(h));
  if (!header.includes("sku")) return { rows: [], errors: [], fatal: 'The first line must name the columns and include "sku"' };
  if (unknown.length) return { rows: [], errors: [], fatal: `Unknown column: ${unknown.slice(0, 5).join(", ")}` };
  if (new Set(header.filter(Boolean)).size !== header.filter(Boolean).length) return { rows: [], errors: [], fatal: "A column is listed twice" };
  if (table.length - 1 > STORE_IMPORT_MAX_ROWS) return { rows: [], errors: [], fatal: `Import up to ${STORE_IMPORT_MAX_ROWS} products at a time` };

  const rows: ProductImportRow[] = [];
  const errors: CsvRowError[] = [];
  const seen = new Set<string>();

  for (let r = 1; r < table.length; r++) {
    const line = r + 1;
    const cells = table[r]!;
    const get = (h: ProductCsvHeader) => {
      const i = header.indexOf(h);
      return i >= 0 ? (cells[i] ?? "").trim() : "";
    };
    const sku = get("sku").toUpperCase();
    const fail = (message: string) => errors.push({ line, sku: sku || null, message });
    if (!sku) {
      fail("Missing SKU");
      continue;
    }
    if (seen.has(sku)) {
      fail("This SKU appears more than once in the file");
      continue;
    }
    seen.add(sku);

    const fields: ProductImportFields = {};
    let ok = true;
    const bad = (message: string) => {
      fail(message);
      ok = false;
    };
    const text1 = (h: ProductCsvHeader) => get(h) || undefined;
    const int = (h: ProductCsvHeader, label: string): number | undefined => {
      const v = get(h);
      if (!v) return undefined;
      const n = parseCsvInt(v);
      if (n == null) bad(`${label} must be a whole number`);
      return n ?? undefined;
    };
    const intOrClear = (h: ProductCsvHeader, label: string): number | null | undefined => {
      const v = get(h);
      if (CLEAR.has(v.toLowerCase())) return null;
      return int(h, label);
    };
    const bool = (h: ProductCsvHeader, label: string): boolean | undefined => {
      const v = get(h);
      if (!v) return undefined;
      const b = parseCsvBool(v);
      if (b == null) bad(`${label} must be yes or no`);
      return b ?? undefined;
    };
    const money = (h: ProductCsvHeader, label: string): number | undefined => {
      const v = get(h);
      if (!v) return undefined;
      const p = rupeesTextToPaise(v);
      if (p == null) bad(`${label} must be a rupee amount like 349 or 349.50`);
      return p ?? undefined;
    };
    const set = <K extends keyof ProductImportFields>(key: K, value: ProductImportFields[K] | undefined) => {
      if (value !== undefined) fields[key] = value;
    };

    set("name", text1("name"));
    set("categoryId", text1("category")?.toLowerCase());
    set("pricePaise", money("price", "Price"));
    set("mrpPaise", CLEAR.has(get("mrp").toLowerCase()) ? null : money("mrp", "MRP"));
    set("stock", int("stock", "Stock"));
    set("lowStockAt", int("low_stock_at", "Low stock level"));
    set("gstBps", int("gst_bps", "GST (basis points)"));
    set("ageMin", int("age_min", "Minimum age"));
    set("ageMax", intOrClear("age_max", "Maximum age"));
    set("brand", text1("brand"));
    set("tagline", text1("tagline"));
    set("description", text1("description"));
    set("skills", get("skills") ? splitList(get("skills")) : undefined);
    set("boxContents", get("box_contents") ? splitList(get("box_contents")) : undefined);
    set("safetyNotes", text1("safety_notes"));
    set("weightGrams", intOrClear("weight_grams", "Weight"));
    set("images", get("images") ? splitList(get("images")) : undefined);
    set("isFeatured", bool("featured", "Featured"));
    set("isActive", bool("active", "Active"));
    set("slug", text1("slug")?.toLowerCase());
    if (fields.stock != null && fields.stock < 0) bad("Stock can't be negative");

    if (ok) rows.push({ line, sku, fields });
  }
  return { rows, errors, fatal: null };
}

/** Reads `sku,stock` (or `sku,qty`) rows for the bulk stock update. */
export function parseStockCsv(text: string): { rows: { line: number; sku: string; qty: number }[]; errors: CsvRowError[]; fatal: string | null } {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], errors: [], fatal: "The CSV is empty" };
  const header = table[0]!.map((h) => h.trim().toLowerCase());
  const skuAt = header.indexOf("sku");
  const qtyAt = header.findIndex((h) => h === "stock" || h === "qty" || h === "quantity");
  if (skuAt < 0 || qtyAt < 0) return { rows: [], errors: [], fatal: 'The first line must be "sku,stock"' };
  if (table.length - 1 > STORE_IMPORT_MAX_ROWS) return { rows: [], errors: [], fatal: `Update up to ${STORE_IMPORT_MAX_ROWS} products at a time` };
  const rows: { line: number; sku: string; qty: number }[] = [];
  const errors: CsvRowError[] = [];
  const seen = new Set<string>();
  for (let r = 1; r < table.length; r++) {
    const line = r + 1;
    const sku = (table[r]![skuAt] ?? "").trim().toUpperCase();
    const qty = parseCsvInt(table[r]![qtyAt] ?? "");
    if (!sku) errors.push({ line, sku: null, message: "Missing SKU" });
    else if (seen.has(sku)) errors.push({ line, sku, message: "This SKU appears more than once in the file" });
    else if (qty == null) errors.push({ line, sku, message: "Stock must be a whole number" });
    else rows.push({ line, sku, qty });
    if (sku) seen.add(sku);
  }
  return { rows, errors, fatal: null };
}
