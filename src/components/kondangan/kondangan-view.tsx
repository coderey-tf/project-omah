"use client";

import { useState } from "react";
import { KondanganType } from "@prisma/client";
import { KondanganItem } from "@/lib/data/kondangan";
import { formatRupiah } from "@/lib/utils";
import { AddKondanganModal } from "./add-kondangan-modal";
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
    if (!confirm("Apakah Anda yakin ingin menghapus catatan ini?")) return;
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

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-pill px-5 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold flex items-center justify-center gap-2 text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Amplop / Kado</span>
        </button>
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onClick={() => setActiveTab("ALL")}
            className={`btn-pill px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-starbucks-green text-white shadow-xs"
                : "bg-white text-text-black-soft border border-border-card hover:border-starbucks-green hover:text-text-black"
            }`}
          >
            Semua Catatan ({records.length})
          </button>
          <button
            onClick={() => setActiveTab("GIVEN")}
            className={`btn-pill px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "GIVEN"
                ? "bg-starbucks-green text-white shadow-xs"
                : "bg-white text-text-black-soft border border-border-card hover:border-starbucks-green hover:text-text-black"
            }`}
          >
            Kita Memberi (Kondangan)
          </button>
          <button
            onClick={() => setActiveTab("RECEIVED")}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredRecords.map((r) => {
            const isGiven = r.type === KondanganType.GIVEN;
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 border border-border-card hover:border-starbucks-green/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isGiven
                          ? "bg-amber-50 text-amber-900 border-amber-200"
                          : "bg-green-light/40 text-starbucks-green border-green-light"
                      }`}
                    >
                      {isGiven ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                      <span>{isGiven ? "KONDANGAN KITA" : "DITERIMA DI HAJATAN"}</span>
                    </span>

                    <span className="text-[11px] text-text-black-soft flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{r.eventDate}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-text-black text-base group-hover:text-starbucks-green transition-colors">
                    {r.personName}
                  </h3>
                  <p className="text-xs text-text-black-soft font-medium mt-0.5">
                    {r.eventName}
                  </p>

                  {/* Value / Gift */}
                  <div className="mt-3 p-2.5 bg-canvas/40 rounded-xl border border-border-card flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-text-black-soft uppercase font-semibold block">
                        {r.amount ? "Nominal Uang" : "Kado Barang"}
                      </span>
                      <span className="text-sm font-bold text-house-green mt-0.5 block">
                        {r.amount ? formatRupiah(r.amount) : r.giftItem || "Kado"}
                      </span>
                    </div>

                    {r.notes && (
                      <span className="text-[11px] text-text-black-soft italic max-w-[150px] truncate text-right">
                        {r.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Delete Action */}
                <div className="flex items-center justify-end pt-3 mt-3 border-t border-border-card/60">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-text-black-soft hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AddKondanganModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
        wallets={wallets}
      />
    </div>
  );
}
