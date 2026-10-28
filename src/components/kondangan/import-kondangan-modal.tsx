"use client";

import { useState, useRef } from "react";
import { KondanganType } from "@/types/enums";
import {
  parseKondanganSpreadsheet,
  downloadKondanganTemplate,
  type KondanganParsedRow,
  type ImportFallbackOptions,
} from "@/lib/kondangan-excel";
import {
  importKondanganRecordsAction,
  type ImportKondanganRecordPayload,
} from "@/actions/kondangan-actions";
import { formatRupiah } from "@/lib/utils";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
  HelpCircle,
  Download,
} from "lucide-react";

interface ImportKondanganModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportKondanganModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportKondanganModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loadingParse, setLoadingParse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<KondanganParsedRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "VALID" | "ERROR">("ALL");
  const [skipErrors, setSkipErrors] = useState(true);

  // Fallback defaults
  const [defaultType, setDefaultType] = useState<"AUTO" | KondanganType>("AUTO");
  const [defaultEventName, setDefaultEventName] = useState("");
  const [defaultDate, setDefaultDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setLoadingParse(true);

    try {
      const options: ImportFallbackOptions = {
        defaultType,
        defaultEventName: defaultEventName.trim() || undefined,
        defaultDate,
      };

      const result = await parseKondanganSpreadsheet(selectedFile, options);
      setParsedRows(result.rows);
      if (result.rows.length === 0) {
        setParseError("Tidak ditemukan data baris yang dapat dibaca pada file ini.");
      }
    } catch (err: any) {
      console.error("Spreadsheet parse error:", err);
      setParseError(err.message || "Gagal membaca format file.");
      setParsedRows([]);
    } finally {
      setLoadingParse(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const resetFile = () => {
    setFile(null);
    setParsedRows([]);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Re-parse when fallback options change (if file is already loaded)
  const reparseWithCurrentOptions = async () => {
    if (!file) return;
    setLoadingParse(true);
    try {
      const options: ImportFallbackOptions = {
        defaultType,
        defaultEventName: defaultEventName.trim() || undefined,
        defaultDate,
      };
      const result = await parseKondanganSpreadsheet(file, options);
      setParsedRows(result.rows);
    } catch (err: any) {
      setParseError(err.message || "Gagal mengurai ulang file.");
    } finally {
      setLoadingParse(false);
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const errorRows = parsedRows.filter((r) => !r.isValid);

  const displayedRows =
    previewFilter === "VALID"
      ? validRows
      : previewFilter === "ERROR"
      ? errorRows
      : parsedRows;

  const handleSubmit = async () => {
    const rowsToImport = skipErrors ? validRows : parsedRows;

    if (rowsToImport.length === 0) {
      alert("Tidak ada baris data valid yang dapat disimpan.");
      return;
    }

    if (!skipErrors && errorRows.length > 0) {
      alert(
        "Terdapat baris data yang error. Aktifkan opsi 'Lewati baris bermasalah' untuk tetap melanjutkan baris yang valid."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ImportKondanganRecordPayload[] = rowsToImport.map((r) => ({
        type: r.type,
        personName: r.personName,
        eventName: r.eventName,
        eventDate: r.eventDate,
        amount: r.amount,
        giftItem: r.giftItem,
        notes: r.notes,
      }));

      const res = await importKondanganRecordsAction(payload);
      if (res.success) {
        alert(`Berhasil mengimpor ${res.count} catatan kondangan! 🎉`);
        onClose();
        onSuccess();
      } else {
        alert(res.error || "Gagal mengimpor catatan.");
      }
    } catch (err: any) {
      console.error("Submit import error:", err);
      alert("Terjadi kesalahan sistem saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full border border-border-card shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-card flex items-center justify-between bg-canvas/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-starbucks-green text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-black text-lg tracking-tight">
                Impor Data Kondangan & Angpao
              </h3>
              <p className="text-xs text-text-black-soft">
                Unggah file Excel atau CSV buku tamu dengan pratinjau validasi sebelum disimpan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-black-soft hover:text-text-black rounded-full hover:bg-canvas transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* STEP 1: If No File Selected, Show Upload & Templates */}
          {!file ? (
            <div className="space-y-5">
              {/* Template Download Section */}
              <div className="p-4 rounded-2xl bg-canvas/60 border border-border-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white border border-border-card flex items-center justify-center text-starbucks-green shrink-0">
                    <Download className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-black">
                      Belum Punya Format Standar?
                    </h4>
                    <p className="text-[11px] text-text-black-soft">
                      Unduh template resmi OmahKu untuk memastikan kolom terbaca sempurna.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadKondanganTemplate("xlsx")}
                    className="btn-pill px-3 py-1.5 bg-white border border-border-card hover:border-starbucks-green text-text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-house-green" />
                    <span>Template Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadKondanganTemplate("csv")}
                    className="btn-pill px-3 py-1.5 bg-white border border-border-card hover:border-starbucks-green text-text-black text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-800" />
                    <span>Template CSV</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border-card hover:border-starbucks-green rounded-3xl p-8 text-center cursor-pointer bg-white transition-all group shadow-xs hover:bg-canvas/30"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleInputChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="h-14 w-14 bg-green-light/40 rounded-2xl flex items-center justify-center mx-auto text-starbucks-green mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <h4 className="font-bold text-text-black text-sm">
                  Tarik & Lepas File Excel / CSV di Sini
                </h4>
                <p className="text-xs text-text-black-soft mt-1">
                  Mendukung berkas <span className="font-semibold text-text-black">.xlsx</span>,{" "}
                  <span className="font-semibold text-text-black">.xls</span>, atau{" "}
                  <span className="font-semibold text-text-black">.csv</span>
                </p>
                <div className="mt-4">
                  <span className="btn-pill px-4 py-1.5 bg-house-green hover:bg-starbucks-green text-white font-semibold text-xs inline-block shadow-xs">
                    Pilih File dari Perangkat
                  </span>
                </div>
              </div>

              {/* Helper Settings / Fallback Form */}
              <div className="p-4 rounded-2xl bg-canvas/40 border border-border-card space-y-3">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-starbucks-green" />
                  <span className="text-xs font-bold text-text-black uppercase tracking-wider">
                    Pengaturan Bantuan (Jika Kolom di Spreadsheet Kurang Lengkap)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-text-black-soft block mb-1">
                      Tipe Catatan Default
                    </label>
                    <select
                      value={defaultType}
                      onChange={(e) => setDefaultType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-border-card rounded-xl text-xs text-text-black focus:ring-2 focus:ring-starbucks-green"
                    >
                      <option value="AUTO">Deteksi Otomatis dari Berkas</option>
                      <option value={KondanganType.RECEIVED}>
                        Semua Diterima (Hajatan Kita)
                      </option>
                      <option value={KondanganType.GIVEN}>
                        Semua Diberikan (Kondangan)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-text-black-soft block mb-1">
                      Default Nama Acara (Jika Kosong)
                    </label>
                    <input
                      type="text"
                      value={defaultEventName}
                      onChange={(e) => setDefaultEventName(e.target.value)}
                      placeholder="cth: Pernikahan Kami"
                      className="w-full px-3 py-2 bg-white border border-border-card rounded-xl text-xs text-text-black placeholder:text-text-black-soft/50 focus:ring-2 focus:ring-starbucks-green"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-text-black-soft block mb-1">
                      Default Tanggal (Jika Kosong)
                    </label>
                    <input
                      type="date"
                      value={defaultDate}
                      onChange={(e) => setDefaultDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-border-card rounded-xl text-xs text-text-black focus:ring-2 focus:ring-starbucks-green"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: File Selected, Show Live Validation & Interactive Preview */
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="p-3.5 rounded-2xl bg-canvas/60 border border-border-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white border border-border-card flex items-center justify-center text-starbucks-green">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-black flex items-center gap-2">
                      <span>{file.name}</span>
                      <span className="text-[10px] text-text-black-soft font-normal">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </p>
                    <p className="text-[11px] text-text-black-soft">
                      {parsedRows.length} total baris terdeteksi dari sheet.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={reparseWithCurrentOptions}
                    disabled={loadingParse}
                    className="p-1.5 text-text-black-soft hover:text-starbucks-green rounded-lg hover:bg-canvas transition-colors text-xs flex items-center gap-1"
                    title="Muat ulang dengan pengaturan saat ini"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingParse ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetFile}
                    className="btn-pill px-3 py-1 bg-white border border-border-card text-text-black-soft hover:text-red-600 text-xs font-medium"
                  >
                    Ganti File
                  </button>
                </div>
              </div>

              {parseError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Validation Summary Stat Cluster */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-green-light/20 border border-green-light flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-starbucks-green uppercase tracking-wider block">
                      Baris Siap Diimpor
                    </span>
                    <span className="text-xl font-bold text-starbucks-green mt-0.5 block">
                      {validRows.length} Data
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-starbucks-green shadow-xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Baris Tidak Valid / Bermasalah
                    </span>
                    <span className="text-xl font-bold text-amber-900 mt-0.5 block">
                      {errorRows.length} Data
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-amber-700 shadow-xs">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Filter Tabs for Preview Table */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter("ALL")}
                    className={`btn-pill px-3 py-1 text-xs font-semibold transition-all ${
                      previewFilter === "ALL"
                        ? "bg-starbucks-green text-white shadow-xs"
                        : "bg-white text-text-black-soft border border-border-card hover:text-text-black"
                    }`}
                  >
                    Semua ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewFilter("VALID")}
                    className={`btn-pill px-3 py-1 text-xs font-semibold transition-all ${
                      previewFilter === "VALID"
                        ? "bg-starbucks-green text-white shadow-xs"
                        : "bg-white text-text-black-soft border border-border-card hover:text-text-black"
                    }`}
                  >
                    Siap Impor ({validRows.length})
                  </button>
                  {errorRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewFilter("ERROR")}
                      className={`btn-pill px-3 py-1 text-xs font-semibold transition-all ${
                        previewFilter === "ERROR"
                          ? "bg-amber-800 text-white shadow-xs"
                          : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-50"
                      }`}
                    >
                      Bermasalah ({errorRows.length})
                    </button>
                  )}
                </div>

                {errorRows.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-text-black-soft select-none">
                    <input
                      type="checkbox"
                      checked={skipErrors}
                      onChange={(e) => setSkipErrors(e.target.checked)}
                      className="rounded text-starbucks-green focus:ring-starbucks-green h-3.5 w-3.5"
                    />
                    <span>Lewati baris error & impor yang valid</span>
                  </label>
                )}
              </div>

              {/* Interactive Preview Table */}
              <div className="rounded-2xl border border-border-card overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-canvas text-text-black-soft text-[10px] uppercase font-bold sticky top-0 border-b border-border-card z-10">
                      <tr>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Tipe</th>
                        <th className="py-2 px-3">Nama Kerabat</th>
                        <th className="py-2 px-3">Acara</th>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Nominal / Kado</th>
                        <th className="py-2 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-card/60">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-text-black-soft">
                            Tidak ada data dalam filter ini.
                          </td>
                        </tr>
                      ) : (
                        displayedRows.map((r) => {
                          const isGiven = r.type === KondanganType.GIVEN;
                          return (
                            <tr
                              key={r.rowNumber}
                              className={`hover:bg-canvas/40 ${
                                !r.isValid ? "bg-red-50/40" : ""
                              }`}
                            >
                              <td className="py-2 px-3 whitespace-nowrap">
                                {r.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-starbucks-green">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Valid</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 cursor-help"
                                    title={r.errorReason}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span className="max-w-[110px] truncate">
                                      {r.errorReason || "Error"}
                                    </span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                    isGiven
                                      ? "bg-amber-50 text-amber-900 border-amber-200"
                                      : "bg-green-light/40 text-starbucks-green border-green-light"
                                  }`}
                                >
                                  {isGiven ? (
                                    <ArrowUpRight className="h-2.5 w-2.5" />
                                  ) : (
                                    <ArrowDownLeft className="h-2.5 w-2.5" />
                                  )}
                                  <span>{isGiven ? "Diberikan" : "Diterima"}</span>
                                </span>
                              </td>
                              <td className="py-2 px-3 font-semibold text-text-black whitespace-nowrap">
                                {r.personName || (
                                  <span className="text-red-500 italic">Kosong</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-text-black-soft truncate max-w-[130px]">
                                {r.eventName}
                              </td>
                              <td className="py-2 px-3 text-text-black-soft whitespace-nowrap">
                                {r.eventDate}
                              </td>
                              <td className="py-2 px-3 font-medium text-house-green whitespace-nowrap">
                                {r.amount
                                  ? formatRupiah(r.amount)
                                  : r.giftItem || (
                                      <span className="text-red-500 italic">Kosong</span>
                                    )}
                              </td>
                              <td className="py-2 px-3 text-text-black-soft truncate max-w-[120px]">
                                {r.notes || "-"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border-card bg-canvas/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-pill px-5 py-2.5 bg-white border border-border-card text-text-black-soft hover:text-text-black font-semibold text-xs transition-colors"
          >
            Batal
          </button>

          {file && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={validRows.length === 0 || isSubmitting || loadingParse}
              className="btn-pill px-6 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Konfirmasi & Impor (
                    {skipErrors ? validRows.length : parsedRows.length} Catatan)
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
