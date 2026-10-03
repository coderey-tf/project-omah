"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { setBudgetLimitAction } from "@/actions/budget-actions";
import { useRouter } from "next/navigation";
import {
  PieChart,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import type { BudgetSummary, CategoryBudgetInfo } from "@/lib/data/budgets";

interface BudgetOverviewProps {
  initialBudgets?: BudgetSummary;
}

export function BudgetOverview({ initialBudgets }: BudgetOverviewProps) {
  const router = useRouter();
  const [data, setData] = useState<BudgetSummary | undefined>(initialBudgets);
  const [editingCategory, setEditingCategory] = useState<CategoryBudgetInfo | null>(null);
  const [limitInput, setLimitInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!data || data.categories.length === 0) return null;

  const handleOpenEdit = (category: CategoryBudgetInfo) => {
    setEditingCategory(category);
    setLimitInput(category.limit > 0 ? category.limit.toString() : "");
    setErrorMsg(null);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const numericLimit = Number(limitInput.replace(/\D/g, "")) || 0;

    try {
      const res = await setBudgetLimitAction({
        categoryId: editingCategory.categoryId,
        limitAmount: numericLimit,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyimpan limit");
        setIsSubmitting(false);
        return;
      }

      // Update local state optimistically
      setData((prev) => {
        if (!prev) return prev;
        const updatedCategories = prev.categories.map((c) => {
          if (c.categoryId !== editingCategory.categoryId) return c;
          const limit = numericLimit;
          const remaining = limit > 0 ? Math.max(0, limit - c.spent) : 0;
          const percentage = limit > 0 ? Math.min(999, Math.round((c.spent / limit) * 100)) : 0;
          let status: CategoryBudgetInfo["status"] = "UNSET";
          if (limit > 0) {
            if (percentage >= 100) status = "EXCEEDED";
            else if (percentage >= 80) status = "WARNING";
            else status = "SAFE";
          }
          return {
            ...c,
            limit,
            remaining,
            percentage,
            status,
          };
        });

        const totalLimit = updatedCategories.reduce((sum, c) => sum + c.limit, 0);
        const totalRemaining = totalLimit > 0 ? Math.max(0, totalLimit - prev.totalSpent) : 0;
        const overallPercentage =
          totalLimit > 0 ? Math.round((prev.totalSpent / totalLimit) * 100) : 0;

        return {
          ...prev,
          totalLimit,
          totalRemaining,
          overallPercentage,
          categories: updatedCategories,
        };
      });

      setEditingCategory(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetAmounts = [500000, 1000000, 2000000, 3500000, 5000000];

  return (
    <section className="rounded-[12px] bg-white p-5 shadow-starbucks-card border border-border-card space-y-4">
      {/* 1. Header with Period and Global Realization */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-starbucks-green">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <span className="font-caption-mono text-xs text-starbucks-green font-bold">
              ANGGARAN & REALISASI PERIODE INI
            </span>
            <h3 className="font-serif text-base font-bold text-house-green">
              {data.periodFormatted}
            </h3>
          </div>
        </div>

        {data.totalLimit > 0 ? (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="text-right">
              <span className="text-xs text-text-black-soft block">Total Terpakai:</span>
              <span className="font-mono text-xs font-bold text-text-black">
                {formatRupiah(data.totalSpent)} / {formatRupiah(data.totalLimit)}
              </span>
            </div>
            <span
              className={`btn-pill text-[10px] px-2.5 py-1 font-bold ${
                data.overallPercentage >= 100
                  ? "bg-danger text-white"
                  : data.overallPercentage >= 80
                  ? "bg-warning/20 text-yellow-800"
                  : "bg-green-light text-starbucks-green"
              }`}
            >
              {data.overallPercentage}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-text-black-soft italic">
            Belum ada limit anggaran kategori yang diset
          </span>
        )}
      </div>

      {/* 2. Category Budget Progress Bars */}
      <div className="space-y-3.5">
        {data.categories.map((cat) => (
          <div
            key={cat.categoryId}
            className="group rounded-[10px] p-3 hover:bg-canvas/60 border border-transparent hover:border-border-card transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-black">
                  {cat.categoryName}
                </span>
                {cat.status === "EXCEEDED" && (
                  <span className="btn-pill text-[9px] px-2 py-0.5 bg-danger text-white font-bold flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    <span>Lewat Limit ({cat.percentage}%)</span>
                  </span>
                )}
                {cat.status === "WARNING" && (
                  <span className="btn-pill text-[9px] px-2 py-0.5 bg-warning/20 text-yellow-800 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    <span>Waspada ({cat.percentage}%)</span>
                  </span>
                )}
                {cat.status === "SAFE" && (
                  <span className="btn-pill text-[9px] px-2 py-0.5 bg-green-light text-starbucks-green font-bold">
                    {cat.percentage}%
                  </span>
                )}
                {cat.status === "UNSET" && (
                  <span className="text-[10px] text-text-black-soft italic">
                    Tanpa limit
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-black font-semibold">
                  {formatRupiah(cat.spent)}
                  {cat.limit > 0 && (
                    <span className="text-text-black-soft font-normal">
                      {" "}
                      / {formatRupiah(cat.limit)}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1 rounded text-text-black-soft hover:text-house-green hover:bg-white transition-colors cursor-pointer"
                  title="Atur limit anggaran"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="h-2 w-full rounded-full bg-canvas border border-border-card/60 overflow-hidden">
              {cat.limit > 0 ? (
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    cat.status === "EXCEEDED"
                      ? "bg-danger"
                      : cat.status === "WARNING"
                      ? "bg-warning"
                      : "bg-starbucks-green"
                  }`}
                  style={{ width: `${Math.min(100, cat.percentage)}%` }}
                />
              ) : (
                <div className="h-full w-0" />
              )}
            </div>

            {/* Sisa Anggaran Note */}
            {cat.limit > 0 && (
              <div className="flex justify-between items-center text-[11px] text-text-black-soft mt-1">
                <span>
                  {cat.spent >= cat.limit
                    ? `Melebihi anggaran ${formatRupiah(cat.spent - cat.limit)}`
                    : `Sisa anggaran: ${formatRupiah(cat.remaining)}`}
                </span>
                {cat.effectiveFrom && (
                  <span className="text-[10px] text-text-black-soft/70">
                    Berlaku seterusnya
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Modal Atur Limit Anggaran */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-[16px] bg-white p-6 shadow-2xl border border-border-card text-text-black">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 text-text-black-soft hover:text-text-black p-1.5 rounded-full hover:bg-canvas transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-light text-starbucks-green">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-house-green">
                  Atur Limit Anggaran
                </h3>
                <p className="text-xs text-text-black-soft">
                  Kategori: <strong className="text-text-black">{editingCategory.categoryName}</strong>
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-[10px] bg-danger/10 p-3 text-xs text-danger font-medium border border-danger/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-black mb-1.5">
                  Nominal Limit per Periode (Rp)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0 = Tanpa Limit"
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    className="w-full rounded-[10px] bg-canvas border border-border-card px-3.5 py-2 text-sm text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                    autoFocus
                  />
                </div>
                {limitInput && Number(limitInput) > 0 && (
                  <p className="font-mono text-xs text-starbucks-green font-bold mt-1.5">
                    {formatRupiah(Number(limitInput))}
                  </p>
                )}
                <p className="text-[11px] text-text-black-soft mt-1">
                  Peringatan otomatis dikirim via Telegram saat realisasi mencapai 80% dan 100%.
                </p>
              </div>

              {/* Preset Chips */}
              <div>
                <span className="block text-[11px] font-semibold text-text-black-soft mb-1.5">
                  Pilihan Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presetAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setLimitInput(amt.toString())}
                      className="btn-pill text-[11px] px-2.5 py-1 bg-canvas hover:bg-green-light hover:text-starbucks-green text-text-black border border-border-card transition-colors cursor-pointer"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLimitInput("0")}
                    className="btn-pill text-[11px] px-2.5 py-1 bg-canvas hover:bg-danger/10 hover:text-danger text-text-black-soft border border-border-card transition-colors cursor-pointer"
                  >
                    Hapus Limit (0)
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  disabled={isSubmitting}
                  className="btn-pill px-4 py-2 text-xs font-semibold text-text-black-soft hover:bg-canvas transition-colors border border-border-card cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-pill flex items-center gap-2 bg-starbucks-green hover:bg-house-green text-white px-5 py-2 text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Simpan Limit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
