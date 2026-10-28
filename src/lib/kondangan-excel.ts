import * as XLSX from "xlsx";
import { KondanganType } from "@/types/enums";
import type { KondanganItem } from "@/lib/data/kondangan";

export interface KondanganParsedRow {
  rowNumber: number;
  type: KondanganType;
  personName: string;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  amount: number | null;
  giftItem: string | null;
  notes: string | null;
  isValid: boolean;
  errorReason?: string;
}

export interface ImportFallbackOptions {
  defaultType?: "AUTO" | KondanganType;
  defaultEventName?: string;
  defaultDate?: string;
}

export interface ParseResult {
  rows: KondanganParsedRow[];
  totalValid: number;
  totalError: number;
  sheetName: string;
}

/**
 * Normalizes number/currency string (e.g. "Rp 150.000", "150,000", 150000)
 */
export function parseCurrencyAmount(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") {
    return isNaN(val) || val <= 0 ? null : Math.round(val);
  }
  const cleanStr = String(val).replace(/[^0-9]/g, "");
  if (!cleanStr) return null;
  const num = parseInt(cleanStr, 10);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Normalizes Excel date, Indonesian date (DD/MM/YYYY), or ISO date to YYYY-MM-DD
 */
export function parseExcelDate(val: any): string | null {
  if (val === null || val === undefined || val === "") return null;

  // 1. If it's an Excel numeric serial date (e.g. 45220)
  if (typeof val === "number" && val > 20000 && val < 90000) {
    try {
      const dateObj = XLSX.SSF.parse_date_code(val);
      if (dateObj && dateObj.y && dateObj.m && dateObj.d) {
        const y = dateObj.y;
        const m = String(dateObj.m).padStart(2, "0");
        const d = String(dateObj.d).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    } catch {
      // fallback to JS date
      const d = new Date((val - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    }
  }

  // 2. If it's a Date instance
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split("T")[0];
  }

  const str = String(val).trim();

  // 3. Match YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 4. Match DD/MM/YYYY or DD-MM-YYYY
  const idMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (idMatch) {
    const d = idMatch[1].padStart(2, "0");
    const m = idMatch[2].padStart(2, "0");
    const y = idMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 5. Native Date parse fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Normalizes KondanganType string
 */
export function parseKondanganType(
  val: any,
  fallbackType?: "AUTO" | KondanganType
): KondanganType {
  const defaultFallback =
    fallbackType && fallbackType !== "AUTO"
      ? fallbackType
      : KondanganType.GIVEN;

  if (val === null || val === undefined || val === "") {
    return defaultFallback;
  }

  const str = String(val).trim().toUpperCase();

  if (
    str.includes("TERIMA") ||
    str.includes("RECEIVED") ||
    str.includes("MASUK") ||
    str.includes("HAJATAN KITA") ||
    str.includes("DITERIMA")
  ) {
    return KondanganType.RECEIVED;
  }

  if (
    str.includes("BERI") ||
    str.includes("GIVEN") ||
    str.includes("KELUAR") ||
    str.includes("KONDANGAN KITA") ||
    str.includes("DIBERIKAN")
  ) {
    return KondanganType.GIVEN;
  }

  return defaultFallback;
}

/**
 * Parse an Excel or CSV file buffer on the client-side
 */
export async function parseKondanganSpreadsheet(
  file: File,
  options: ImportFallbackOptions = {}
): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("File tidak memiliki sheet data.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse to array of rows (first row is header)
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rawRows.length < 2) {
    throw new Error("File kosong atau hanya memiliki baris header.");
  }

  const headerRow = rawRows[0].map((h) => String(h || "").trim().toLowerCase());

  // Map header columns flexibly
  let colTypeIdx = -1;
  let colNameIdx = -1;
  let colEventIdx = -1;
  let colDateIdx = -1;
  let colAmountIdx = -1;
  let colGiftIdx = -1;
  let colNotesIdx = -1;

  headerRow.forEach((h, idx) => {
    if (h.includes("tipe") || h.includes("jenis") || h.includes("status")) {
      colTypeIdx = idx;
    } else if (
      h.includes("nama") ||
      h.includes("kerabat") ||
      h.includes("tamu") ||
      h.includes("pemberi") ||
      h.includes("orang")
    ) {
      if (colNameIdx === -1) colNameIdx = idx;
    } else if (
      h.includes("acara") ||
      h.includes("hajatan") ||
      h.includes("event") ||
      h.includes("momen")
    ) {
      colEventIdx = idx;
    } else if (
      h.includes("tanggal") ||
      h.includes("tgl") ||
      h.includes("date") ||
      h.includes("waktu")
    ) {
      colDateIdx = idx;
    } else if (
      h.includes("nominal") ||
      h.includes("uang") ||
      h.includes("amplop") ||
      h.includes("jumlah") ||
      h.includes("amount")
    ) {
      colAmountIdx = idx;
    } else if (
      h.includes("kado") ||
      h.includes("barang") ||
      h.includes("hadiah") ||
      h.includes("gift")
    ) {
      colGiftIdx = idx;
    } else if (
      h.includes("catatan") ||
      h.includes("keterangan") ||
      h.includes("notes") ||
      h.includes("note")
    ) {
      colNotesIdx = idx;
    }
  });

  // Fallback defaults if columns not detected by name:
  // Standard positions: [0: Tipe, 1: Nama, 2: Acara, 3: Tanggal, 4: Nominal, 5: Kado, 6: Catatan]
  if (colNameIdx === -1 && rawRows[0].length >= 2) colNameIdx = 1;
  if (colDateIdx === -1 && rawRows[0].length >= 4) colDateIdx = 3;
  if (colAmountIdx === -1 && rawRows[0].length >= 5) colAmountIdx = 4;

  const parsedRows: KondanganParsedRow[] = [];
  let totalValid = 0;
  let totalError = 0;

  const todayStr = options.defaultDate || new Date().toISOString().split("T")[0];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    // Check if entire row is empty
    if (!row || row.every((c) => !c || String(c).trim() === "")) {
      continue;
    }

    const rowNumber = i + 1; // 1-indexed Excel row
    const rawType = colTypeIdx !== -1 ? row[colTypeIdx] : "";
    const rawName = colNameIdx !== -1 ? row[colNameIdx] : "";
    const rawEvent = colEventIdx !== -1 ? row[colEventIdx] : "";
    const rawDate = colDateIdx !== -1 ? row[colDateIdx] : "";
    const rawAmount = colAmountIdx !== -1 ? row[colAmountIdx] : "";
    const rawGift = colGiftIdx !== -1 ? row[colGiftIdx] : "";
    const rawNotes = colNotesIdx !== -1 ? row[colNotesIdx] : "";

    const type = parseKondanganType(rawType, options.defaultType);
    const personName = String(rawName || "").trim();
    const eventName =
      String(rawEvent || "").trim() ||
      options.defaultEventName?.trim() ||
      "Acara Keluarga";
    const eventDate = parseExcelDate(rawDate) || todayStr;
    const amount = parseCurrencyAmount(rawAmount);
    const giftItem = String(rawGift || "").trim() || null;
    const notes = String(rawNotes || "").trim() || null;

    // Validation checks
    let isValid = true;
    let errorReason: string | undefined = undefined;

    if (!personName || personName.length < 2) {
      isValid = false;
      errorReason = "Nama kerabat / orang kosong atau terlalu pendek";
    } else if (!amount && !giftItem) {
      isValid = false;
      errorReason = "Nominal uang dan kado barang keduanya kosong";
    }

    if (isValid) {
      totalValid++;
    } else {
      totalError++;
    }

    parsedRows.push({
      rowNumber,
      type,
      personName,
      eventName,
      eventDate,
      amount,
      giftItem,
      notes,
      isValid,
      errorReason,
    });
  }

  return {
    rows: parsedRows,
    totalValid,
    totalError,
    sheetName: firstSheetName,
  };
}

/**
 * Downloads a sample template file for users
 */
export function downloadKondanganTemplate(format: "xlsx" | "csv") {
  const headers = [
    "Tipe",
    "Nama Kerabat",
    "Nama Acara",
    "Tanggal Acara",
    "Nominal (Rp)",
    "Kado Barang",
    "Catatan",
  ];

  const sampleRows = [
    [
      "DIBERIKAN",
      "Budi Santoso",
      "Pernikahan Budi & Ani",
      "2026-10-15",
      150000,
      "",
      "Amplop resepsi di Gedung Serbaguna",
    ],
    [
      "DITERIMA",
      "Keluarga Besar Pak RT",
      "Pernikahan Kami",
      "2026-10-20",
      300000,
      "",
      "Amplop hajatan di rumah",
    ],
    [
      "DITERIMA",
      "Tante Mira",
      "Syukuran Rumah Baru",
      "2026-10-22",
      "",
      "Set Cangkir Keramik & Piring",
      "Kado syukuran",
    ],
    [
      "DIBERIKAN",
      "Rian Kurniawan",
      "Khitanan Akbar",
      "2026-10-25",
      100000,
      "",
      "Amplop titip via tetangga",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws["!cols"] = [
    { wch: 14 }, // Tipe
    { wch: 22 }, // Nama Kerabat
    { wch: 26 }, // Nama Acara
    { wch: 14 }, // Tanggal Acara
    { wch: 16 }, // Nominal
    { wch: 28 }, // Kado Barang
    { wch: 32 }, // Catatan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template Kondangan");

  const today = new Date().toISOString().slice(0, 10);
  const filename = `template-kondangan-omahku-${today}.${format}`;

  if (format === "csv") {
    // Generate CSV UTF-8 with BOM
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, filename);
  }
}

/**
 * Exports KondanganItem array to an Excel (.xlsx) file
 */
export function exportKondanganToExcel(
  records: KondanganItem[],
  filename?: string
) {
  const headers = [
    "No",
    "Tipe",
    "Nama Kerabat",
    "Nama Acara",
    "Tanggal Acara",
    "Nominal Uang (Rp)",
    "Kado Barang",
    "Catatan",
  ];

  const rows = records.map((r, idx) => [
    idx + 1,
    r.type === KondanganType.GIVEN ? "DIBERIKAN (KONDANGAN)" : "DITERIMA (HAJATAN)",
    r.personName,
    r.eventName,
    r.eventDate,
    r.amount || 0,
    r.giftItem || "-",
    r.notes || "-",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws["!cols"] = [
    { wch: 6 },  // No
    { wch: 24 }, // Tipe
    { wch: 24 }, // Nama Kerabat
    { wch: 28 }, // Nama Acara
    { wch: 15 }, // Tanggal Acara
    { wch: 20 }, // Nominal
    { wch: 25 }, // Kado Barang
    { wch: 30 }, // Catatan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Catatan Kondangan");

  const today = new Date().toISOString().slice(0, 10);
  const outputFilename = filename || `omahku-kondangan-${today}.xlsx`;

  XLSX.writeFile(wb, outputFilename);
}
