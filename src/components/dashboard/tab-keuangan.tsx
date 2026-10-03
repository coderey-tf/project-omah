"use client";

import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import {
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PayBillModal } from "./pay-bill-modal";
import { BudgetOverview } from "./budget-overview";
import { SavingsCard } from "./savings-card";
import { unmarkBillPaidAction } from "@/actions/bill-actions";
import type { BudgetSummary } from "@/lib/data/budgets";
import type { EnrichedSavingsGoal } from "@/lib/data/savings";

export interface BillItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  daysRemaining: number;
  category: string;
  categoryId?: string | null;
  period?: "MONTHLY" | "YEARLY";
  dueDay?: number;
  isPaidThisCycle: boolean;
  isOverdue?: boolean;
  lastPaidDueDate?: string | null;
}


interface WalletItem {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface TransactionItem {
  id: string;
  description: string;
  amount: number;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  category: string;
  walletName: string;
  date: string;
}

interface TabKeuanganProps {
  initialBills?: BillItem[];
  initialWallets?: WalletItem[];
  initialTransactions?: TransactionItem[];
  initialBudgets?: BudgetSummary;
  initialSavingsGoals?: EnrichedSavingsGoal[];
}

export function TabKeuangan({
  initialBills,
  initialWallets,
  initialTransactions,
  initialBudgets,
  initialSavingsGoals,
}: TabKeuanganProps) {
  const router = useRouter();
  const [bills, setBills] = useState<BillItem[]>(initialBills || []);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<BillItem | null>(null);
  const [showPaidBills, setShowPaidBills] = useState(false);
  const [isUnmarkingId, setIsUnmarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialBills) {
      setBills(initialBills);
    }
  }, [initialBills]);

  const [wallets] = useState<WalletItem[]>(
    initialWallets || [
      { id: "w1", name: "BCA Rekening Bersama", type: "Rekening Bank", balance: 14200000 },
      { id: "w2", name: "Kas Tunai Dompet", type: "Uang Tunai", balance: 1750000 },
      { id: "w3", name: "GoPay / OVO Kebutuhan", type: "Dompet Digital", balance: 2500000 },
    ]
  );

  const [transactions] = useState<TransactionItem[]>(
    initialTransactions || [
      {
        id: "t1",
        description: "Belanja Sayur & Buah Segar",
        amount: 85000,
        type: "EXPENSE",
        category: "Bahan Makanan",
        walletName: "Kas Tunai",
        date: "Hari ini, 08:30 WIB",
      },
      {
        id: "t2",
        description: "Bensin Pertamax Motor",
        amount: 50000,
        type: "EXPENSE",
        category: "Transportasi",
        walletName: "GoPay",
        date: "Kemarin, 17:15 WIB",
      },
      {
        id: "t3",
        description: "Transfer Honor Proyek Tambahan",
        amount: 2500000,
        type: "INCOME",
        category: "Pemasukan",
        walletName: "BCA Bersama",
        date: "30 Sep 2026",
      },
    ]
  );

  const pendingBills = bills.filter((b) => !b.isPaidThisCycle);
  const paidBills = bills.filter((b) => b.isPaidThisCycle);

  const handleUnmarkPaid = async (billId: string) => {
    setIsUnmarkingId(billId);
    try {
      const res = await unmarkBillPaidAction(billId);
      if (res.success) {
        setBills((prev) =>
          prev.map((b) => (b.id === billId ? { ...b, isPaidThisCycle: false } : b))
        );
        router.refresh();
      }
    } finally {
      setIsUnmarkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TAGIHAN MENDESAK ALERT CARD OR CELEBRATORY CARD */}
      {pendingBills.length > 0 ? (
        <section className="rounded-[12px] bg-white p-5 border-l-4 border-l-danger shadow-starbucks-card border-y border-r border-border-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
              <span className="font-caption-mono text-xs text-danger tracking-wider font-bold">
                PERINGATAN · {pendingBills.length} TAGIHAN PERLU DISELESAIKAN
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {pendingBills.map((bill) => (
              <div
                key={bill.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[12px] bg-canvas p-3.5 border border-border-card"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm text-text-black font-semibold">{bill.name}</h3>
                    <span
                      className={`btn-pill text-[10px] px-2.5 py-0.5 font-bold ${
                        bill.isOverdue || bill.daysRemaining === 0
                          ? "bg-danger text-white"
                          : "bg-warning/20 text-yellow-800"
                      }`}
                    >
                      {bill.isOverdue
                        ? "LEWAT JATUH TEMPO"
                        : bill.daysRemaining === 0
                        ? "JATUH TEMPO HARI INI"
                        : `H-${bill.daysRemaining}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-black-soft mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Batas: {bill.dueDate}</span>
                    <span>·</span>
                    <span>{bill.category}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border-card">
                  <span className="text-base text-text-black font-bold">
                    {formatRupiah(bill.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBillForPayment(bill)}
                    className="btn-pill flex items-center gap-1.5 bg-green-accent hover:bg-starbucks-green text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Tandai Lunas</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paid bills toggle inside alert section if any */}
          {paidBills.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border-card">
              <button
                type="button"
                onClick={() => setShowPaidBills(!showPaidBills)}
                className="flex items-center gap-1.5 text-xs text-text-black-soft hover:text-house-green font-semibold transition-colors cursor-pointer"
              >
                <span>Tagihan Lunas Siklus Ini ({paidBills.length})</span>
                {showPaidBills ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showPaidBills && (
                <div className="space-y-2 mt-2 pt-2">
                  {paidBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-[10px] bg-canvas/70 p-3 border border-border-card text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="btn-pill text-[10px] px-2 py-0.5 bg-green-accent text-white font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Lunas</span>
                        </span>
                        <span className="font-semibold text-text-black">{bill.name}</span>
                        <span className="text-text-black-soft">· {formatRupiah(bill.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-text-black-soft text-[11px]">Batas: {bill.dueDate}</span>
                        <button
                          type="button"
                          onClick={() => handleUnmarkPaid(bill.id)}
                          disabled={isUnmarkingId === bill.id}
                          className="flex items-center gap-1 text-[11px] text-text-black-soft hover:text-danger font-medium hover:underline cursor-pointer disabled:opacity-50"
                          title="Batalkan status lunas"
                        >
                          {isUnmarkingId === bill.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          <span>Batal Lunas</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-[12px] bg-white p-5 border-l-4 border-l-starbucks-green shadow-starbucks-card border-y border-r border-border-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-light text-starbucks-green">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm text-house-green font-bold flex items-center gap-1.5">
                <span>Semua Tagihan Siklus Ini Sudah Lunas</span>
                <Sparkles className="h-3.5 w-3.5 text-warm-gold" />
              </h3>
              <p className="text-xs text-text-black-soft mt-0.5">
                Tidak ada tagihan tertunda yang perlu diselesaikan bulan ini. Kerja bagus! ☕
              </p>
            </div>
          </div>

          {paidBills.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border-card">
              <button
                type="button"
                onClick={() => setShowPaidBills(!showPaidBills)}
                className="flex items-center gap-1.5 text-xs text-text-black-soft hover:text-house-green font-semibold transition-colors cursor-pointer"
              >
                <span>Lihat Tagihan Lunas Bulan Ini ({paidBills.length})</span>
                {showPaidBills ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showPaidBills && (
                <div className="space-y-2 mt-2 pt-2">
                  {paidBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-[10px] bg-canvas/70 p-3 border border-border-card text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="btn-pill text-[10px] px-2 py-0.5 bg-green-accent text-white font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Lunas</span>
                        </span>
                        <span className="font-semibold text-text-black">{bill.name}</span>
                        <span className="text-text-black-soft">· {formatRupiah(bill.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-text-black-soft text-[11px]">Batas: {bill.dueDate}</span>
                        <button
                          type="button"
                          onClick={() => handleUnmarkPaid(bill.id)}
                          disabled={isUnmarkingId === bill.id}
                          className="flex items-center gap-1 text-[11px] text-text-black-soft hover:text-danger font-medium hover:underline cursor-pointer disabled:opacity-50"
                          title="Batalkan status lunas"
                        >
                          {isUnmarkingId === bill.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          <span>Batal Lunas</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}


      {/* 2. ANGGARAN & REALISASI PER KATEGORI */}
      <BudgetOverview initialBudgets={initialBudgets} />

      {/* 3. TARGET TABUNGAN KELUARGA */}
      <SavingsCard initialGoals={initialSavingsGoals} />

      {/* 4. RINGKASAN DOMPET RUMAH TANGGA */}

      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="font-caption-mono text-xs text-starbucks-green font-bold">
            DOMPET & REKENING AKTIF
          </span>
          <Link
            href="/wallets"
            className="flex items-center gap-1 text-xs text-green-accent hover:underline font-semibold"
          >
            <span>Kelola Dompet</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="rounded-[12px] bg-white p-5 shadow-starbucks-card border border-border-card transition-all hover:border-green-accent"
            >
              <div className="flex items-center justify-between text-text-black-soft mb-2">
                <span className="text-xs text-text-black-soft font-medium">
                  {wallet.type}
                </span>
                <div className="h-8 w-8 rounded-full bg-green-light/40 flex items-center justify-center text-starbucks-green">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <h4 className="text-sm text-text-black font-semibold truncate mb-1">
                {wallet.name}
              </h4>
              <p className="text-xl font-bold text-text-black">
                {formatRupiah(wallet.balance)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. TIGA TRANSAKSI TERAKHIR */}
      <section className="rounded-[12px] bg-white p-6 shadow-starbucks-card border border-border-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-card">
          <div>
            <span className="font-caption-mono text-xs text-starbucks-green font-bold">
              AKTIVITAS TERBARU
            </span>
            <h3 className="text-base text-text-black font-bold">3 Transaksi Terakhir</h3>
          </div>
          <Link
            href="/transactions"
            className="btn-pill border border-green-accent text-green-accent hover:bg-green-light/30 px-3.5 py-1.5 text-xs font-semibold transition-colors"
          >
            Lihat Semua →
          </Link>
        </div>

        <div className="divide-y divide-border-card">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-canvas/50 px-2 rounded-[8px] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    tx.type === "INCOME"
                      ? "bg-green-light text-starbucks-green"
                      : "bg-canvas text-text-black-soft"
                  }`}
                >
                  {tx.type === "INCOME" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-danger" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-black">{tx.description}</p>
                  <p className="text-xs text-text-black-soft">
                    {tx.category} · {tx.walletName} · {tx.date}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-sm font-bold ${
                    tx.type === "INCOME" ? "text-starbucks-green" : "text-text-black"
                  }`}
                >
                  {tx.type === "INCOME" ? "+" : "-"}
                  {formatRupiah(tx.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MODAL BAYAR TAGIHAN */}
      <PayBillModal
        isOpen={selectedBillForPayment !== null}
        onClose={() => setSelectedBillForPayment(null)}
        bill={selectedBillForPayment}
        wallets={wallets}
        onSuccess={() => {
          if (selectedBillForPayment) {
            setBills((prev) =>
              prev.map((b) =>
                b.id === selectedBillForPayment.id
                  ? { ...b, isPaidThisCycle: true }
                  : b
              )
            );
          }
          router.refresh();
        }}
      />
    </div>
  );
}

