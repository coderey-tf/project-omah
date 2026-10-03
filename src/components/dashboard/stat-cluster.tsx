"use client";

import { formatRupiah } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";

interface StatClusterProps {
  totalBalance: number;
  periodSpent: number;
  periodBudget: number;
  todayExpense: number;
  monthlyIncome: number;
  periodDates?: string;
}

export function StatCluster({
  totalBalance = 18450000,
  periodSpent = 4850000,
  periodBudget = 9000000,
  todayExpense = 125000,
  monthlyIncome = 15000000,
  periodDates = "1 Okt — 31 Okt 2026",
}: Partial<StatClusterProps>) {
  const budgetPercentage = Math.min(
    100,
    Math.round((periodSpent / (periodBudget || 1)) * 100)
  );

  // Status color based on budget percentage
  const getProgressColor = () => {
    if (budgetPercentage >= 100) return "bg-danger";
    if (budgetPercentage >= 80) return "bg-warning";
    return "bg-green-accent";
  };

  return (
    <section className="w-full space-y-4 mb-6">
      {/* 1. Feature Band (House Green #1E3932 Signature Starbucks Surface) */}
      <div className="rounded-[12px] bg-house-green text-white p-6 sm:p-7 shadow-starbucks-card relative overflow-hidden">
        {/* Subtle decorative circle ring in background */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border-[20px] border-white/5 pointer-events-none" />

        {/* Top Eyebrow & Gold Ceremony Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/15">
          <div className="flex items-center gap-2">
            <span className="font-caption-mono text-[11px] text-white/70 tracking-wider">
              KEUANGAN RUMAH TANGGA
            </span>
            <span className="inline-flex items-center gap-1 btn-pill border border-gold bg-gold/10 px-2.5 py-0.5 text-[11px] text-gold font-semibold">
              <Sparkles className="h-3 w-3 text-gold" />
              TRANSPARAN BERDUA ★
            </span>
          </div>
          <span className="text-xs text-white/70 font-medium">
            Periode: {periodDates}
          </span>
        </div>

        {/* Total Saldo Display */}
        <div className="pt-5 pb-5">
          <p className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-1">
            Total Saldo Tersedia
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl text-white/70 font-normal">Rp</span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-sans">
              {formatRupiah(totalBalance).replace("Rp", "").trim()}
            </h2>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="rounded-[12px] bg-black/20 p-4 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/90">
              Anggaran Pengeluaran Bulan Ini
            </span>
            <span
              className={`text-xs font-bold ${
                budgetPercentage >= 100
                  ? "text-red-300"
                  : budgetPercentage >= 80
                  ? "text-yellow-300"
                  : "text-green-light"
              }`}
            >
              {budgetPercentage}% TERPAKAI
            </span>
          </div>

          {/* Progress track */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getProgressColor()}`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-white/70 font-medium">
            <span>{formatRupiah(periodSpent)} digunakan</span>
            <span>Batas: {formatRupiah(periodBudget)}</span>
          </div>
        </div>
      </div>

      {/* 2. White 2-Up Metrics Cards */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-[12px] bg-white p-4 sm:p-5 shadow-starbucks-card border border-border-card">
          <div className="flex items-center gap-1.5 text-text-black-soft mb-1.5">
            <ArrowDownRight className="h-4 w-4 text-danger" />
            <span className="font-caption-mono text-[11px] text-text-black-soft font-semibold">
              PENGELUARAN HARI INI
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-text-black">
            {formatRupiah(todayExpense)}
          </p>
        </div>

        <div className="rounded-[12px] bg-white p-4 sm:p-5 shadow-starbucks-card border border-border-card">
          <div className="flex items-center gap-1.5 text-text-black-soft mb-1.5">
            <ArrowUpRight className="h-4 w-4 text-green-accent" />
            <span className="font-caption-mono text-[11px] text-text-black-soft font-semibold">
              TOTAL PEMASUKAN
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-starbucks-green">
            {formatRupiah(monthlyIncome)}
          </p>
        </div>
      </div>
    </section>
  );
}
