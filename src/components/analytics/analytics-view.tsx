"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnnualAnalyticsData } from "@/lib/data/analytics";
import { formatRupiah } from "@/lib/utils";
import { CashflowLineChart } from "./cashflow-line-chart";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  BarChart3,
  Percent,
  Download,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

interface AnalyticsViewProps {
  data: AnnualAnalyticsData;
}

export function AnalyticsView({ data }: AnalyticsViewProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number>(data.year);

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    router.push(`/analytics?year=${newYear}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-house-green text-white flex items-center justify-center shadow-md">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <span className="font-caption-mono text-xs text-starbucks-green font-bold tracking-wider uppercase">
              Fase 2 • Laporan & Tren Tahunan
            </span>
            <h1 className="text-2xl font-bold text-text-black tracking-tight">
              Laporan Tahunan & Tren Keuangan
            </h1>
            <p className="text-xs text-text-black-soft mt-0.5">
              Analisis makro arus kas, rasio tabungan, dan breakdown pengeluaran 12 bulan.
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-canvas px-3 py-1.5 rounded-2xl border border-border-card">
            <Calendar className="h-4 w-4 text-starbucks-green" />
            <span className="text-xs font-bold text-text-black">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-bold text-house-green focus:outline-none cursor-pointer"
            >
              {data.availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <a
            href="/api/export/csv?type=transactions"
            download
            className="btn-pill px-4 py-2 bg-warm-sand hover:bg-warm-sand/80 text-house-green font-semibold flex items-center gap-1.5 text-xs border border-border-card transition-all"
          >
            <Download className="h-3.5 w-3.5 text-starbucks-green" />
            <span>Unduh CSV</span>
          </a>
        </div>
      </div>

      {/* 2. Stat Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Total Pemasukan</p>
            <p className="text-xl font-bold text-starbucks-green mt-0.5">{formatRupiah(data.totalIncome)}</p>
            <span className="text-[10px] text-text-black-soft">Tahun {data.year}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-green-light/40 flex items-center justify-center text-starbucks-green">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Total Pengeluaran</p>
            <p className="text-xl font-bold text-amber-800 mt-0.5">{formatRupiah(data.totalExpense)}</p>
            <span className="text-[10px] text-text-black-soft">Tahun {data.year}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Tabungan Bersih (Net)</p>
            <p className={`text-xl font-bold mt-0.5 ${data.netSavings >= 0 ? "text-house-green" : "text-red-600"}`}>
              {formatRupiah(data.netSavings)}
            </p>
            <span className="text-[10px] text-text-black-soft">
              {data.netSavings >= 0 ? "Surplus akumulatif" : "Defisit anggaran"}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-canvas flex items-center justify-center text-house-green">
            <PiggyBank className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Rasio Tabungan Rata-rata</p>
            <p className="text-xl font-bold text-house-green mt-0.5">{data.overallSavingsRate}%</p>
            <span className="text-[10px] text-text-black-soft">Dari total pemasukan</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-green-light/40 flex items-center justify-center text-starbucks-green">
            <Percent className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. 12-Month Cashflow Trajectory Line Chart */}
      <div className="bg-white p-6 rounded-3xl border border-border-card shadow-starbucks-card space-y-4">
        <CashflowLineChart monthlyData={data.monthlyData} year={data.year} />

        {/* Insight footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 bg-canvas/50 rounded-xl border border-border-card">
            <span className="text-text-black-soft block text-[10px] uppercase font-semibold">
              Rata-rata Pengeluaran / Bulan
            </span>
            <span className="text-sm font-bold text-text-black mt-0.5 block font-mono">
              {formatRupiah(data.averageMonthlyExpense)}
            </span>
          </div>

          <div className="p-3.5 bg-canvas/50 rounded-xl border border-border-card">
            <span className="text-text-black-soft block text-[10px] uppercase font-semibold">
              Bulan Pengeluaran Terbesar
            </span>
            <span className="text-sm font-bold text-[#C87A54] mt-0.5 block">
              {data.highestExpenseMonth || "-"}
            </span>
          </div>

          <div className="p-3.5 bg-canvas/50 rounded-xl border border-border-card">
            <span className="text-text-black-soft block text-[10px] uppercase font-semibold">
              Bulan Paling Hemat
            </span>
            <span className="text-sm font-bold text-starbucks-green mt-0.5 block">
              {data.lowestExpenseMonth || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Category Breakdown Section */}
      <div className="bg-white p-6 rounded-3xl border border-border-card shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-card">
          <PieChart className="h-5 w-5 text-starbucks-green" />
          <div>
            <h3 className="font-bold text-text-black text-base">Distribusi Pos Pengeluaran ({data.year})</h3>
            <p className="text-xs text-text-black-soft">Kategori dengan proporsi anggaran belanja terbesar sepanjang tahun</p>
          </div>
        </div>

        {data.categoryBreakdown.length === 0 ? (
          <p className="text-xs text-text-black-soft p-4 text-center">
            Belum ada transaksi pengeluaran tercatat di tahun {data.year}.
          </p>
        ) : (
          <div className="space-y-3">
            {data.categoryBreakdown.map((cat, idx) => (
              <div key={cat.categoryId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-black">{idx + 1}. {cat.categoryName}</span>
                    <span className="text-[11px] font-caption-mono text-text-black-soft">
                      ({cat.percentage}%)
                    </span>
                  </div>
                  <span className="font-bold text-house-green font-caption-mono">
                    {formatRupiah(cat.totalAmount)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-canvas rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full bg-starbucks-green rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
