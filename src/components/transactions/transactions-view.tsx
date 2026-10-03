"use client";

import { useState, useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Filter,
  Wallet,
  Plus,
  Coffee,
  Calendar,
  Tag,
  User,
  Download,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { QuickTransactionModal } from "@/components/dashboard/quick-transaction-modal";
import { useRouter } from "next/navigation";

interface TransactionItem {
  id: string;
  amount: number;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  note: string;
  categoryName: string;
  categoryIcon: string | null;
  walletName: string;
  toWalletName: string | null;
  occurredOn: string;
  dateFormatted: string;
  creatorName: string;
}

interface TransactionsViewProps {
  initialData: {
    wallets: Array<{ id: string; name: string; type: string }>;
    categories: Array<{ id: string; name: string; kind: string }>;
    transactions: TransactionItem[];
    totalExpense: number;
    totalIncome: number;
    netFlow: number;
    count: number;
  };
}

export function TransactionsView({ initialData }: TransactionsViewProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"ALL" | "EXPENSE" | "INCOME" | "TRANSFER">("ALL");
  const [selectedWalletId, setSelectedWalletId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    return initialData.transactions.filter((tx) => {
      if (selectedType !== "ALL" && tx.type !== selectedType) return false;
      if (selectedWalletId !== "ALL" && !tx.walletName.toLowerCase().includes(selectedWalletId.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesNote = tx.note.toLowerCase().includes(query);
        const matchesCategory = tx.categoryName.toLowerCase().includes(query);
        const matchesWallet = tx.walletName.toLowerCase().includes(query);
        if (!matchesNote && !matchesCategory && !matchesWallet) return false;
      }
      return true;
    });
  }, [initialData.transactions, selectedType, selectedWalletId, searchQuery]);

  // Recalculate filtered totals
  const { currentExpense, currentIncome } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === "EXPENSE") exp += tx.amount;
      if (tx.type === "INCOME") inc += tx.amount;
    });
    return { currentExpense: exp, currentIncome: inc };
  }, [filteredTransactions]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Page Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="font-caption-mono text-[11px] text-starbucks-green font-bold tracking-wider uppercase">
            Catatan Keuangan Rumah
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-house-green font-bold tracking-tight">
            Riwayat Transaksi
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href="/api/export/csv?type=transactions"
            download
            className="btn-pill inline-flex items-center justify-center gap-2 bg-white hover:bg-warm-sand text-house-green border border-border-card px-4 py-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Unduh data riwayat transaksi sebagai file CSV"
          >
            <Download className="h-4 w-4 text-starbucks-green" />
            <span>Ekspor CSV</span>
          </a>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-pill inline-flex items-center justify-center gap-2 bg-starbucks-green hover:bg-green-accent text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-[12px] bg-white p-4 border border-border-card shadow-starbucks-card">
          <div className="flex items-center gap-2 text-text-black-soft text-xs mb-1">
            <ArrowDownRight className="h-4 w-4 text-red-600" />
            <span className="font-medium">Total Pengeluaran</span>
          </div>
          <p className="font-mono text-lg sm:text-xl font-bold text-text-black">
            {formatRupiah(currentExpense)}
          </p>
        </div>

        <div className="rounded-[12px] bg-white p-4 border border-border-card shadow-starbucks-card">
          <div className="flex items-center gap-2 text-text-black-soft text-xs mb-1">
            <ArrowUpRight className="h-4 w-4 text-green-accent" />
            <span className="font-medium">Total Pemasukan</span>
          </div>
          <p className="font-mono text-lg sm:text-xl font-bold text-starbucks-green">
            {formatRupiah(currentIncome)}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-[12px] bg-white p-4 border border-border-card shadow-starbucks-card">
          <div className="flex items-center gap-2 text-text-black-soft text-xs mb-1">
            <Wallet className="h-4 w-4 text-warm-gold" />
            <span className="font-medium">Arus Kas Bersih</span>
          </div>
          <p
            className={`font-mono text-lg sm:text-xl font-bold ${
              currentIncome - currentExpense >= 0 ? "text-starbucks-green" : "text-red-600"
            }`}
          >
            {currentIncome - currentExpense >= 0 ? "+" : ""}
            {formatRupiah(currentIncome - currentExpense)}
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-[12px] bg-white p-4 border border-border-card shadow-starbucks-card space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
          <input
            type="text"
            placeholder="Cari transaksi, toko, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-border-input bg-canvas text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border-card">
          {/* Type Filters */}
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", "EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => {
              const label =
                t === "ALL"
                  ? "Semua"
                  : t === "EXPENSE"
                  ? "Pengeluaran"
                  : t === "INCOME"
                  ? "Pemasukan"
                  : "Transfer";

              const isSelected = selectedType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`btn-pill px-3 py-1 text-xs border font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? "border-green-accent bg-green-light text-starbucks-green font-semibold"
                      : "border-border-card bg-white text-text-black-soft hover:border-text-black-soft"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Wallet Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[11px] font-semibold text-text-black-soft whitespace-nowrap">
              Dompet:
            </span>
            <button
              onClick={() => setSelectedWalletId("ALL")}
              className={`btn-pill px-2.5 py-0.5 text-xs border cursor-pointer font-medium ${
                selectedWalletId === "ALL"
                  ? "border-starbucks-green bg-starbucks-green text-white font-semibold"
                  : "border-border-card bg-canvas text-text-black-soft hover:border-text-black-soft"
              }`}
            >
              Semua
            </button>
            {initialData.wallets.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWalletId(w.name)}
                className={`btn-pill px-2.5 py-0.5 text-xs border cursor-pointer font-medium whitespace-nowrap ${
                  selectedWalletId === w.name
                    ? "border-starbucks-green bg-starbucks-green text-white font-semibold"
                    : "border-border-card bg-canvas text-text-black-soft hover:border-text-black-soft"
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Transactions List */}
      <div className="rounded-[12px] bg-white border border-border-card shadow-starbucks-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-card flex items-center justify-between bg-canvas/30">
          <span className="font-caption-mono text-xs text-text-black-soft font-semibold">
            DITEMUKAN {filteredTransactions.length} TRANSAKSI
          </span>
          <span className="text-xs text-text-black-soft">Diurutkan waktu terbaru</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-text-black-soft">
            <Coffee className="h-10 w-10 mx-auto text-warm-gold/60 mb-2" />
            <p className="text-sm font-medium">Belum ada transaksi yang sesuai kriteria.</p>
            <p className="text-xs text-text-black-soft mt-1">
              Gunakan tombol Tambah Transaksi untuk mencatat pengeluaran baru.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-card">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="px-4 sm:px-5 py-3.5 flex items-center justify-between hover:bg-canvas/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      tx.type === "EXPENSE"
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : tx.type === "INCOME"
                        ? "bg-green-light text-starbucks-green border border-green-accent/20"
                        : "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}
                  >
                    {tx.type === "EXPENSE" ? (
                      <ArrowDownRight className="h-5 w-5" />
                    ) : tx.type === "INCOME" ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowLeftRight className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-text-black leading-tight">
                        {tx.note}
                      </p>
                      <span className="font-caption-mono text-[10px] px-2 py-0.5 rounded-full bg-canvas border border-border-card text-text-black-soft">
                        {tx.categoryName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-black-soft mt-1">
                      <span>{tx.walletName}</span>
                      {tx.toWalletName && (
                        <span>➔ {tx.toWalletName}</span>
                      )}
                      <span>•</span>
                      <span>{tx.dateFormatted}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-starbucks-green font-medium">
                        <User className="h-3 w-3" />
                        {tx.creatorName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-mono text-sm sm:text-base font-bold ${
                      tx.type === "EXPENSE"
                        ? "text-text-black"
                        : tx.type === "INCOME"
                        ? "text-starbucks-green"
                        : "text-blue-600"
                    }`}
                  >
                    {tx.type === "EXPENSE" ? "-" : tx.type === "INCOME" ? "+" : ""}
                    {formatRupiah(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <QuickTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => router.refresh()}
        wallets={initialData.wallets}
        categories={initialData.categories}
      />
    </div>
  );
}
