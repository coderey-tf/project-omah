"use client";

import { useState, useMemo } from "react";
import { KondanganType } from "@/types/enums";
import type { KondanganItem } from "@/lib/data/kondangan";
import { formatRupiah } from "@/lib/utils";
import { exportKondanganToExcel } from "@/lib/kondangan-excel";
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Eye,
} from "lucide-react";

interface ExportKondanganModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: KondanganItem[];
  currentFilteredRecords: KondanganItem[];
  activeTab: "ALL" | "GIVEN" | "RECEIVED";
  searchQuery: string;
}

type ExportScope = "CURRENT" | "ALL" | "GIVEN" | "RECEIVED";
type ExportFormat = "xlsx" | "csv";

export function ExportKondanganModal({
  isOpen,
  onClose,
  allRecords,
  currentFilteredRecords,
  activeTab,
  searchQuery,
}: ExportKondanganModalProps) {
  const [scope, setScope] = useState<ExportScope>(
    searchQuery.trim().length > 0 ? "CURRENT" : "ALL"
  );
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [isExporting, setIsExporting] = useState(false);

  // Determine which records to export based on selected scope
  const targetRecords = useMemo(() => {
    switch (scope) {
      case "CURRENT":
        return currentFilteredRecords;
      case "GIVEN":
        return allRecords.filter((r) => r.type === KondanganType.GIVEN);
      case "RECEIVED":
        return allRecords.filter((r) => r.type === KondanganType.RECEIVED);
      case "ALL":
      default:
        return allRecords;
    }
  }, [scope, allRecords, currentFilteredRecords]);

  // Calculate statistics for preview
  const totalGiven = useMemo(
    () =>
      targetRecords
        .filter((r) => r.type === KondanganType.GIVEN)
        .reduce((sum, r) => sum + (r.amount || 0), 0),
    [targetRecords]
  );

  const totalReceived = useMemo(
    () =>
      targetRecords
        .filter((r) => r.type === KondanganType.RECEIVED)
        .reduce((sum, r) => sum + (r.amount || 0), 0),
    [targetRecords]
  );

  if (!isOpen) return null;

  const handleDownload = () => {
    if (targetRecords.length === 0) {
      alert("Tidak ada data yang sesuai filter untuk diekspor.");
      return;
    }

    setIsExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const scopeLabel =
        scope === "GIVEN"
          ? "diberikan"
          : scope === "RECEIVED"
          ? "diterima"
          : "semua";
      const filename = `omahku-kondangan-${scopeLabel}-${today}.${format}`;

      if (format === "xlsx") {
        exportKondanganToExcel(targetRecords, filename);
        onClose();
      } else {
        // Direct download CSV
        let url = `/api/export/csv?type=kondangan`;
        if (scope === "GIVEN") url += `&kondanganType=GIVEN`;
        if (scope === "RECEIVED") url += `&kondanganType=RECEIVED`;
        window.location.href = url;
        onClose();
      }
    } catch (err: any) {
      console.error("Export error:", err);
      alert("Gagal mengekspor file: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Preview slice (first 5 records)
  const previewRows = targetRecords.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full border border-border-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-card flex items-center justify-between bg-canvas/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-house-green text-white flex items-center justify-center shadow-xs">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-black text-lg tracking-tight">
                Pratinjau & Ekspor Data Kondangan
              </h3>
              <p className="text-xs text-text-black-soft">
                Periksa data dan pilih format file sebelum mengunduh.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 1. Filter Scope Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-black flex items-center gap-1.5 uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5 text-starbucks-green" />
              <span>1. Pilih Data yang Ingin Diekspor</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {searchQuery.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setScope("CURRENT")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    scope === "CURRENT"
                      ? "border-starbucks-green bg-green-light/20 text-starbucks-green font-bold shadow-xs"
                      : "border-border-card bg-white text-text-black-soft hover:border-starbucks-green/50"
                  }`}
                >
                  <span className="text-[11px] block">Hasil Cari Aktif</span>
                  <span className="text-xs font-bold block mt-0.5 text-text-black">
                    {currentFilteredRecords.length} Catatan
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setScope("ALL")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  scope === "ALL"
                    ? "border-starbucks-green bg-green-light/20 text-starbucks-green font-bold shadow-xs"
                    : "border-border-card bg-white text-text-black-soft hover:border-starbucks-green/50"
                }`}
              >
                <span className="text-[11px] block">Semua Catatan</span>
                <span className="text-xs font-bold block mt-0.5 text-text-black">
                  {allRecords.length} Catatan
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScope("RECEIVED")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  scope === "RECEIVED"
                    ? "border-starbucks-green bg-green-light/20 text-starbucks-green font-bold shadow-xs"
                    : "border-border-card bg-white text-text-black-soft hover:border-starbucks-green/50"
                }`}
              >
                <span className="text-[11px] block">Amplop Diterima</span>
                <span className="text-xs font-bold block mt-0.5 text-starbucks-green">
                  {allRecords.filter((r) => r.type === KondanganType.RECEIVED).length} Catatan
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScope("GIVEN")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  scope === "GIVEN"
                    ? "border-starbucks-green bg-green-light/20 text-starbucks-green font-bold shadow-xs"
                    : "border-border-card bg-white text-text-black-soft hover:border-starbucks-green/50"
                }`}
              >
                <span className="text-[11px] block">Amplop Diberikan</span>
                <span className="text-xs font-bold block mt-0.5 text-amber-800">
                  {allRecords.filter((r) => r.type === KondanganType.GIVEN).length} Catatan
                </span>
              </button>
            </div>
          </div>

          {/* 2. Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-black flex items-center gap-1.5 uppercase tracking-wider">
              <FileSpreadsheet className="h-3.5 w-3.5 text-starbucks-green" />
              <span>2. Pilih Format Berkas</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("xlsx")}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  format === "xlsx"
                    ? "border-starbucks-green bg-green-light/20 shadow-xs"
                    : "border-border-card bg-white hover:border-starbucks-green/40"
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-house-green text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-text-black">
                    Microsoft Excel (.xlsx)
                  </p>
                  <p className="text-[10px] text-text-black-soft">
                    Rekomendasi • Kolom rapi & format mata uang otomatis
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  format === "csv"
                    ? "border-starbucks-green bg-green-light/20 shadow-xs"
                    : "border-border-card bg-white hover:border-starbucks-green/40"
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-amber-800 text-white flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-text-black">
                    File CSV (.csv)
                  </p>
                  <p className="text-[10px] text-text-black-soft">
                    Format universal • UTF-8 BOM ramah Excel & database
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Summary Stats Banner */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-canvas/60 border border-border-card">
            <div>
              <span className="text-[10px] text-text-black-soft uppercase font-semibold block">
                Total Baris Ekspor
              </span>
              <span className="text-base font-bold text-text-black">
                {targetRecords.length} Catatan
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-black-soft uppercase font-semibold block">
                Total Diterima
              </span>
              <span className="text-base font-bold text-starbucks-green">
                {formatRupiah(totalReceived)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-black-soft uppercase font-semibold block">
                Total Diberikan
              </span>
              <span className="text-base font-bold text-amber-800">
                {formatRupiah(totalGiven)}
              </span>
            </div>
          </div>

          {/* 4. Live Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-black flex items-center gap-1.5 uppercase tracking-wider">
                <Eye className="h-3.5 w-3.5 text-starbucks-green" />
                <span>3. Pratinjau Baris Data (Preview)</span>
              </label>
              <span className="text-[11px] text-text-black-soft">
                {previewRows.length > 0
                  ? `Menampilkan ${previewRows.length} dari ${targetRecords.length} data`
                  : "0 data"}
              </span>
            </div>

            {previewRows.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-border-card text-xs text-text-black-soft">
                Tidak ada data yang sesuai dengan kriteria yang dipilih.
              </div>
            ) : (
              <div className="rounded-2xl border border-border-card overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-canvas text-text-black-soft text-[10px] uppercase font-bold sticky top-0 border-b border-border-card">
                      <tr>
                        <th className="py-2 px-3">Tipe</th>
                        <th className="py-2 px-3">Nama Kerabat</th>
                        <th className="py-2 px-3">Acara</th>
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Nominal / Kado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-card/60">
                      {previewRows.map((r, idx) => {
                        const isGiven = r.type === KondanganType.GIVEN;
                        return (
                          <tr key={r.id || idx} className="hover:bg-canvas/30">
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
                              {r.personName}
                            </td>
                            <td className="py-2 px-3 text-text-black-soft truncate max-w-[140px]">
                              {r.eventName}
                            </td>
                            <td className="py-2 px-3 text-text-black-soft whitespace-nowrap">
                              {r.eventDate}
                            </td>
                            <td className="py-2 px-3 font-medium text-house-green whitespace-nowrap">
                              {r.amount ? formatRupiah(r.amount) : r.giftItem || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {targetRecords.length > 5 && (
                  <div className="p-2 bg-canvas/40 border-t border-border-card text-center text-[10px] text-text-black-soft italic">
                    + {targetRecords.length - 5} catatan lainnya akan disertakan dalam berkas hasil unduhan.
                  </div>
                )}
              </div>
            )}
          </div>
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

          <button
            type="button"
            onClick={handleDownload}
            disabled={targetRecords.length === 0 || isExporting}
            className="btn-pill px-6 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="h-4 w-4" />
            <span>
              {isExporting
                ? "Menyiapkan Berkas..."
                : `Unduh ${format.toUpperCase()} (${targetRecords.length} Catatan)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
