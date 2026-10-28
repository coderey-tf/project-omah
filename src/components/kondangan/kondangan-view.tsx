"use client";

import { useState } from "react";
import { KondanganType } from "@/types/enums";
import type { KondanganItem } from "@/lib/data/kondangan";
import { formatRupiah } from "@/lib/utils";
import { AddKondanganModal } from "./add-kondangan-modal";
import { ExportKondanganModal } from "./export-kondangan-modal";
import { ImportKondanganModal } from "./import-kondangan-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteKondanganAction } from "@/actions/kondangan-actions";
import {
  Gift,
  HeartHandshake,
  Search,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck,
  CheckCircle2,
  History,
  Download,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface KondanganViewProps {
  initialRecords: KondanganItem[];
  totalReceived: number;
  totalGiven: number;
  wallets: Array<{ id: string; name: string; balance: number }>;
}

export function KondanganView({
  initialRecords,
  totalReceived,
  totalGiven,
  wallets,
}: KondanganViewProps) {
  const [records, setRecords] = useState<KondanganItem[]>(initialRecords);
  const [activeTab, setActiveTab] = useState<"ALL" | "GIVEN" | "RECEIVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesTab = activeTab === "ALL" || r.type === activeTab;
    const matchesSearch =
      r.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.giftItem && r.giftItem.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Pagination calculations
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = pageSize === -1
    ? filteredRecords
    : filteredRecords.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  // Calculate reciprocal statistics if user is searching for a specific name
  const searchedPersonRecords = searchQuery.trim().length >= 2
    ? records.filter((r) => r.personName.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : [];

  const searchedGivenTotal = searchedPersonRecords
    .filter((r) => r.type === KondanganType.GIVEN)
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const searchedReceivedTotal = searchedPersonRecords
    .filter((r) => r.type === KondanganType.RECEIVED)
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const netBalance = totalReceived - totalGiven;

  const handleDelete = async (id: string) => {
    const res = await deleteKondanganAction(id);
    if (res.success) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert(res.error || "Gagal menghapus");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-house-green text-white flex items-center justify-center shadow-md">
            <Gift className="h-7 w-7" />
          </div>
          <div>
            <span className="font-caption-mono text-xs text-starbucks-green font-bold tracking-wider uppercase">
              Fase 2 • Buku Tamu & Hubungan Sosial
            </span>
            <h1 className="text-2xl font-bold text-text-black tracking-tight">
              Catatan Angpao & Kondangan
            </h1>
            <p className="text-xs text-text-black-soft mt-0.5">
              Rekam jejak timbal balik amplop hajatan kerabat agar silaturahmi tetap harmonis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="btn-pill px-4 py-2 bg-white border border-border-card hover:border-starbucks-green text-text-black hover:text-starbucks-green font-semibold flex items-center justify-center gap-1.5 text-xs shadow-xs transition-all"
            title="Impor data dari berkas Excel atau CSV dengan pratinjau"
          >
            <UploadCloud className="h-4 w-4 text-starbucks-green" />
            <span>Impor</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="btn-pill px-4 py-2 bg-white border border-border-card hover:border-starbucks-green text-text-black hover:text-house-green font-semibold flex items-center justify-center gap-1.5 text-xs shadow-xs transition-all"
            title="Pratinjau dan ekspor data ke Excel atau CSV"
          >
            <Download className="h-4 w-4 text-house-green" />
            <span>Ekspor</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-pill px-4 py-2 bg-house-green hover:bg-starbucks-green text-white font-semibold flex items-center justify-center gap-1.5 text-xs shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Amplop</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Amplop Kita Terima</p>
            <p className="text-xl font-bold text-starbucks-green mt-0.5">{formatRupiah(totalReceived)}</p>
            <span className="text-[10px] text-text-black-soft">Saat hajatan keluarga kita</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-green-light/40 flex items-center justify-center text-starbucks-green">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Amplop Kita Berikan</p>
            <p className="text-xl font-bold text-amber-800 mt-0.5">{formatRupiah(totalGiven)}</p>
            <span className="text-[10px] text-text-black-soft">Saat menghadiri kondangan</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Selisih Timbal Balik</p>
            <p className={`text-xl font-bold mt-0.5 ${netBalance >= 0 ? "text-house-green" : "text-amber-800"}`}>
              {formatRupiah(netBalance)}
            </p>
            <span className="text-[10px] text-text-black-soft">
              {netBalance >= 0 ? "Surplus penerimaan" : "Lebih banyak memberi"}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-canvas flex items-center justify-center text-house-green">
            <HeartHandshake className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Reciprocal Search & Lookups */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Ketik nama kerabat untuk cek histori amplop timbal balik (cth: Budi, Joko, Tante Mira)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-card rounded-2xl text-xs text-text-black placeholder:text-text-black-soft/60 focus:outline-none focus:ring-2 focus:ring-starbucks-green shadow-xs"
          />
        </div>

        {/* Reciprocal Comparison Highlight Card */}
        {searchedPersonRecords.length > 0 && searchQuery.trim().length >= 2 && (
          <div className="p-4 rounded-2xl bg-warm-sand/40 border border-border-card shadow-xs space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-starbucks-green" />
                <h4 className="font-bold text-xs text-house-green">
                  Histori Timbal Balik: &quot;{searchQuery.trim()}&quot;
                </h4>
              </div>
              <span className="text-[11px] font-caption-mono text-text-black-soft">
                {searchedPersonRecords.length} Catatan Ditemukan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-border-card">
                <span className="text-[10px] text-text-black-soft uppercase font-semibold block">
                  Pemberian Dari Beliau (Diterima)
                </span>
                <span className="text-sm font-bold text-starbucks-green mt-0.5 block">
                  {formatRupiah(searchedReceivedTotal)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-border-card">
                <span className="text-[10px] text-text-black-soft uppercase font-semibold block">
                  Balasan Kita (Diberikan)
                </span>
                <span className="text-sm font-bold text-amber-800 mt-0.5 block">
                  {formatRupiah(searchedGivenTotal)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-text-black-soft italic">
              💡 Rekomendasi kondangan berikutnya: Menyesuaikan dengan histori pemberian sebelumnya.
            </p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("ALL");
              setCurrentPage(1);
            }}
            className={`btn-pill px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-starbucks-green text-white shadow-xs"
                : "bg-white text-text-black-soft border border-border-card hover:border-starbucks-green hover:text-text-black"
            }`}
          >
            Semua Catatan ({records.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("GIVEN");
              setCurrentPage(1);
            }}
            className={`btn-pill px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "GIVEN"
                ? "bg-starbucks-green text-white shadow-xs"
                : "bg-white text-text-black-soft border border-border-card hover:border-starbucks-green hover:text-text-black"
            }`}
          >
            Kita Memberi (Kondangan)
          </button>
          <button
            onClick={() => {
              setActiveTab("RECEIVED");
              setCurrentPage(1);
            }}
            className={`btn-pill px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "RECEIVED"
                ? "bg-starbucks-green text-white shadow-xs"
                : "bg-white text-text-black-soft border border-border-card hover:border-starbucks-green hover:text-text-black"
            }`}
          >
            Kita Menerima (Hajatan)
          </button>
        </div>
      </div>

      {/* 4. Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-border-card shadow-xs space-y-3">
          <div className="h-16 w-16 bg-canvas rounded-full flex items-center justify-center mx-auto text-starbucks-green">
            <Gift className="h-8 w-8 text-text-black-soft" />
          </div>
          <h3 className="font-bold text-text-black text-base">Belum Ada Catatan Amplop / Kado</h3>
          <p className="text-xs text-text-black-soft max-w-sm mx-auto">
            Catat amplop yang diberikan saat kondangan teman atau yang diterima saat hajatan pernikahan Anda.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-pill px-5 py-2 bg-house-green hover:bg-starbucks-green text-white font-semibold text-xs inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Amplop Pertama</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-border-card shadow-xs overflow-hidden">
          {/* Header Bar */}
          <div className="px-5 py-3.5 bg-canvas/40 border-b border-border-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-black uppercase tracking-wider">
                Daftar Catatan ({filteredRecords.length})
              </span>
              <span className="text-[11px] text-text-black-soft">
                • Diurutkan tanggal terbaru
              </span>
            </div>

            {filteredRecords.length > 25 && (
              <div className="flex items-center gap-2 text-xs text-text-black-soft">
                <span>Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-border-card rounded-lg text-xs text-text-black focus:ring-1 focus:ring-starbucks-green cursor-pointer"
                >
                  <option value={25}>25 per halaman</option>
                  <option value={50}>50 per halaman</option>
                  <option value={100}>100 per halaman</option>
                  <option value={-1}>Tampilkan Semua</option>
                </select>
              </div>
            )}
          </div>

          {/* List Items */}
          <div className="divide-y divide-border-card/70">
            {paginatedRecords.map((r) => {
              const isGiven = r.type === KondanganType.GIVEN;
              return (
                <div
                  key={r.id}
                  className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-canvas/30 transition-colors group"
                >
                  {/* Left: Indicator Icon + Person & Event Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        isGiven
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-green-light/40 text-starbucks-green border border-green-light"
                      }`}
                      title={isGiven ? "Amplop Kita Berikan" : "Amplop Kita Terima"}
                    >
                      {isGiven ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-text-black group-hover:text-starbucks-green transition-colors truncate">
                          {r.personName}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                            isGiven
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : "bg-green-light/40 text-starbucks-green border-green-light"
                          }`}
                        >
                          {isGiven ? "DIBERIKAN" : "DITERIMA"}
                        </span>
                        <span className="text-[11px] text-text-black-soft bg-canvas px-2.5 py-0.5 rounded-full border border-border-card truncate max-w-[220px]">
                          {r.eventName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-text-black-soft mt-1 flex-wrap">
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3 text-text-black-soft/70" />
                          <span>{r.eventDate}</span>
                        </span>
                        {r.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-[11px] text-text-black-soft/90 truncate max-w-[280px]">
                              &quot;{r.notes}&quot;
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Nominal Uang / Kado + Delete Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {r.amount ? (
                        <span
                          className={`font-mono text-sm sm:text-base font-bold block ${
                            isGiven ? "text-amber-800" : "text-starbucks-green"
                          }`}
                        >
                          {formatRupiah(r.amount)}
                        </span>
                      ) : (
                        <span className="font-semibold text-xs sm:text-sm text-house-green flex items-center justify-end gap-1">
                          <Gift className="h-3.5 w-3.5" />
                          <span>{r.giftItem || "Kado Barang"}</span>
                        </span>
                      )}
                      <span className="block text-[10px] text-text-black-soft">
                        {r.amount ? (isGiven ? "Keluar" : "Masuk") : "Kado"}
                      </span>
                    </div>

                    <button
                      onClick={() => setDeleteTargetId(r.id)}
                      className="p-1.5 text-text-black-soft hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors opacity-70 group-hover:opacity-100"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Navigation Footer */}
          {pageSize !== -1 && totalPages > 1 && (
            <div className="px-5 py-3.5 bg-canvas/40 border-t border-border-card flex items-center justify-between gap-3 text-xs">
              <span className="text-text-black-soft text-[11px]">
                Menampilkan {(safeCurrentPage - 1) * pageSize + 1} -{" "}
                {Math.min(safeCurrentPage * pageSize, filteredRecords.length)} dari{" "}
                {filteredRecords.length} catatan
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-border-card bg-white text-text-black hover:border-starbucks-green disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-2.5 py-1 text-xs font-semibold text-text-black">
                  {safeCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-border-card bg-white text-text-black hover:border-starbucks-green disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AddKondanganModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
        wallets={wallets}
      />

      {/* Export Preview Modal */}
      <ExportKondanganModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allRecords={records}
        currentFilteredRecords={filteredRecords}
        activeTab={activeTab}
        searchQuery={searchQuery}
      />

      {/* Import Preview Modal */}
      <ImportKondanganModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Hapus Catatan Kondangan"
        description="Apakah Anda yakin ingin menghapus catatan amplop ini? Data yang dihapus tidak dapat dipulihkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="destructive"
        onConfirm={async () => {
          if (deleteTargetId) {
            await handleDelete(deleteTargetId);
          }
        }}
      />
    </div>
  );
}
