import { RawRow } from "./types";

// Bundled snapshot used when SHEET_CSV_URL is not set or the sheet can't be reached.
const FALLBACK_ROWS: RawRow[] = [
  row("Kavita", "123 Bosri", ["lift", "parking", "pets"], 23500, 3, 5, 2, 6),
  row("Kavita", "234 Pimpri", ["lift", "parking", "pets"], 24000, 3, 4, 5, 8),
  row("Kavita", "426 PCMC", ["lift", "parking", "pets"], 26000, 3, 3, 2, 11),
  row("Riya", "452 Kaserwadi", ["lift", "pets"], 18000, 2, 5, 4, 12),
  row("Riya", "112 Chinchwad", ["lift", "parking"], 17500, 3, 10, 5, 13),
  row("Riya", "118 Wakad", ["lift", "parking", "pets"], 22000, 3, 7, 4, 11),
  row("Meera", "276 Bosri", ["lift", "parking"], 24000, 3, 8, 6, 13),
  row("Meera", "83 Viman Nagar", ["lift", "parking", "pets"], 22500, 3, 3, 5, 14),
  row("Meera", "221 District Court", ["lift", "parking", "pets"], 2500, 3, 6, 6, 15),
];

function row(
  name: string,
  address: string,
  checkins: string[],
  rent: number,
  bathrooms: number,
  distHinjewadi: number,
  distGym: number,
  distFamily: number
): RawRow {
  return {
    timestamp: new Date().toISOString(),
    name,
    address,
    checkins,
    rent,
    bathrooms,
    distHinjewadi,
    distGym,
    distFamily,
  };
}

function normalizeSheetUrl(url: string): string {
  // Accept a normal "edit" sheet link and convert it to a CSV export link.
  const editMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (editMatch && !url.includes("export")) {
    const gidMatch = url.match(/[?#&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    return `https://docs.google.com/spreadsheets/d/${editMatch[1]}/export?format=csv&gid=${gid}`;
  }
  return url;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      record.push(field);
      rows.push(record);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    rows.push(record);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function findColumn(headers: string[], keywords: string[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (const kw of keywords) {
    const idx = lower.findIndex((h) => h.includes(kw));
    if (idx !== -1) return idx;
  }
  return -1;
}

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function rowsFromCsv(csv: string): RawRow[] {
  const table = parseCsv(csv);
  if (table.length < 2) return [];
  const headers = table[0];

  const col = {
    timestamp: findColumn(headers, ["timestamp"]),
    name: findColumn(headers, ["name"]),
    address: findColumn(headers, ["adress", "address"]),
    checkins: findColumn(headers, ["check-in", "checkin", "check in"]),
    rent: findColumn(headers, ["rent"]),
    bathrooms: findColumn(headers, ["bathroom"]),
    distHinjewadi: findColumn(headers, ["hinjewadi"]),
    distGym: findColumn(headers, ["gym"]),
    distFamily: findColumn(headers, ["family"]),
  };

  return table.slice(1).map((cells) => {
    const checkinRaw = col.checkins !== -1 ? cells[col.checkins] ?? "" : "";
    const checkins = checkinRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    return {
      timestamp: col.timestamp !== -1 ? cells[col.timestamp] ?? "" : "",
      name: col.name !== -1 ? (cells[col.name] ?? "").trim() : "",
      address: col.address !== -1 ? (cells[col.address] ?? "").trim() : "",
      checkins,
      rent: toNumber(col.rent !== -1 ? cells[col.rent] : undefined),
      bathrooms: toNumber(col.bathrooms !== -1 ? cells[col.bathrooms] : undefined),
      distHinjewadi: toNumber(col.distHinjewadi !== -1 ? cells[col.distHinjewadi] : undefined),
      distGym: toNumber(col.distGym !== -1 ? cells[col.distGym] : undefined),
      distFamily: toNumber(col.distFamily !== -1 ? cells[col.distFamily] : undefined),
    };
  });
}

export interface SheetFetchResult {
  source: "sheet" | "fallback";
  note: string;
  rows: RawRow[];
}

export async function fetchResponses(): Promise<SheetFetchResult> {
  const sheetUrl = process.env.SHEET_CSV_URL;

  if (!sheetUrl) {
    return {
      source: "fallback",
      note: "SHEET_CSV_URL is not configured yet, showing the bundled sample responses.",
      rows: FALLBACK_ROWS,
    };
  }

  try {
    const csvUrl = normalizeSheetUrl(sheetUrl);
    const bustedUrl = csvUrl + (csvUrl.includes("?") ? "&" : "?") + "cb=" + Date.now();
    const res = await fetch(bustedUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheet responded with ${res.status}`);
    const csv = await res.text();
    const rows = rowsFromCsv(csv);
    if (rows.length === 0) throw new Error("No rows parsed from sheet");
    return {
      source: "sheet",
      note: "Live from Google Sheet.",
      rows,
    };
  } catch (err) {
    return {
      source: "fallback",
      note: `Could not read the Google Sheet (${
        err instanceof Error ? err.message : "unknown error"
      }), showing the bundled sample responses instead.`,
      rows: FALLBACK_ROWS,
    };
  }
}
