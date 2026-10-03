"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import {
  createSavingsGoalAction,
  updateSavedAmountAction,
  deleteSavingsGoalAction,
} from "@/actions/savings-actions";
import { useRouter } from "next/navigation";
import {
  Target,
  Plus,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Sparkles,
  TrendingUp,
  Trash2,
  Coins,
} from "lucide-react";
import type { EnrichedSavingsGoal } from "@/lib/data/savings";

interface SavingsCardProps {
  initialGoals?: EnrichedSavingsGoal[];
}

export function SavingsCard({ initialGoals }: SavingsCardProps) {
  const router = useRouter();
  const [goals, setGoals] = useState<EnrichedSavingsGoal[]>(initialGoals || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<EnrichedSavingsGoal | null>(null);

  // Form states for adding
  const [nameInput, setNameInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [initialSavedInput, setInitialSavedInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");

  // Form state for updating saved amount
  const [updateAmountInput, setUpdateAmountInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const targetAmount = Number(targetInput.replace(/\D/g, "")) || 0;
    const savedAmount = Number(initialSavedInput.replace(/\D/g, "")) || 0;

    if (!nameInput.trim()) {
      setErrorMsg("Nama target tabungan wajib diisi");
      setIsSubmitting(false);
      return;
    }

    if (targetAmount <= 0) {
      setErrorMsg("Nominal target harus lebih dari 0");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await createSavingsGoalAction({
        name: nameInput.trim(),
        targetAmount,
        savedAmount,
        deadline: deadlineInput || null,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal membuat target tabungan");
        setIsSubmitting(false);
        return;
      }

      setIsAddModalOpen(false);
      setNameInput("");
      setTargetInput("");
      setInitialSavedInput("");
      setDeadlineInput("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const newAmount = Number(updateAmountInput.replace(/\D/g, "")) || 0;

    try {
      const res = await updateSavedAmountAction({
        goalId: editingGoal.id,
        savedAmount: newAmount,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal memperbarui saldo tabungan");
        setIsSubmitting(false);
        return;
      }

      // Optimistic local update
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== editingGoal.id) return g;
          const remaining = Math.max(0, g.targetAmount - newAmount);
          const percentage = Math.min(100, Math.round((newAmount / g.targetAmount) * 100));
          return {
            ...g,
            savedAmount: newAmount,
            remaining,
            percentage,
            isCompleted: newAmount >= g.targetAmount,
          };
        })
      );

      setEditingGoal(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus target tabungan ini?")) return;

    try {
      const res = await deleteSavingsGoalAction(goalId);
      if (res.success) {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        router.refresh();
      }
    } catch (err) {
      console.error("Gagal menghapus target:", err);
    }
  };

  const addPresets = [100000, 500000, 1000000, 2500000];

  return (
    <section className="rounded-[12px] bg-white p-5 shadow-starbucks-card border border-border-card space-y-4">
      {/* 1. Header with Add Button */}
      <div className="flex items-center justify-between pb-3 border-b border-border-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-warm-gold">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <span className="font-caption-mono text-xs text-starbucks-green font-bold">
              RENCANA FINANSIAL
            </span>
            <h3 className="font-serif text-base font-bold text-house-green">
              Target Tabungan Keluarga
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setIsAddModalOpen(true);
          }}
          className="btn-pill flex items-center gap-1.5 bg-green-accent hover:bg-starbucks-green text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Target</span>
        </button>
      </div>

      {/* 2. Goals List or Empty State */}
      {goals.length === 0 ? (
        <div className="rounded-[10px] bg-canvas p-6 text-center border border-dashed border-border-card">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-light/40 text-starbucks-green mb-2">
            <Coins className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold text-text-black">Belum Ada Target Tabungan</h4>
          <p className="text-xs text-text-black-soft max-w-sm mx-auto mt-1 mb-3">
            Mulai rencanakan dana darurat, liburan bersama, atau renovasi rumah dengan target nominal yang jelas.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-pill inline-flex items-center gap-1.5 bg-starbucks-green hover:bg-house-green text-white px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Mulai Buat Target Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-[10px] bg-canvas/60 p-3.5 border border-border-card hover:border-green-accent/50 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-text-black">{goal.name}</h4>
                    {goal.isCompleted ? (
                      <span className="btn-pill text-[9px] px-2 py-0.5 bg-warm-gold text-white font-bold flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>Tercapai! 🎉</span>
                      </span>
                    ) : (
                      <span className="btn-pill text-[9px] px-2 py-0.5 bg-green-light text-starbucks-green font-bold">
                        {goal.percentage}%
                      </span>
                    )}
                  </div>
                  {goal.deadlineFormatted && (
                    <div className="flex items-center gap-1 text-[11px] text-text-black-soft mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Tenggat: {goal.deadlineFormatted}
                        {goal.daysLeft !== null && (
                          <span className={goal.daysLeft < 0 ? "text-danger ml-1" : "ml-1"}>
                            ({goal.daysLeft < 0 ? "Lewat tenggat" : `${goal.daysLeft} hari lagi`})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGoal(goal);
                      setUpdateAmountInput(goal.savedAmount.toString());
                      setErrorMsg(null);
                    }}
                    className="btn-pill bg-white hover:bg-green-light hover:text-starbucks-green text-text-black border border-border-card px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Update Saldo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1.5 text-text-black-soft hover:text-danger rounded hover:bg-white transition-colors cursor-pointer"
                    title="Hapus target tabungan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 w-full rounded-full bg-white border border-border-card/70 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    goal.isCompleted ? "bg-warm-gold" : "bg-starbucks-green"
                  }`}
                  style={{ width: `${goal.percentage}%` }}
                />
              </div>

              {/* Amount summary */}
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-mono text-text-black font-bold">
                  {formatRupiah(goal.savedAmount)}
                  <span className="text-text-black-soft font-normal"> / {formatRupiah(goal.targetAmount)}</span>
                </span>
                <span className="text-[11px] text-text-black-soft">
                  {goal.isCompleted
                    ? "Target telah tercapai!"
                    : `Kurang ${formatRupiah(goal.remaining)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Modal Tambah Target Tabungan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-[16px] bg-white p-6 shadow-2xl border border-border-card text-text-black">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-text-black-soft hover:text-text-black p-1.5 rounded-full hover:bg-canvas transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-warm-gold">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-house-green">
                  Tambah Target Tabungan
                </h3>
                <p className="text-xs text-text-black-soft">
                  Rencanakan tabungan bersama keluarga
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-[10px] bg-danger/10 p-3 text-xs text-danger font-medium border border-danger/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-black mb-1">
                  Nama Target Tabungan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dana Darurat, Liburan Bali"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-[10px] bg-canvas border border-border-card px-3.5 py-2 text-xs text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-black mb-1">
                  Nominal Target (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Contoh: 10000000"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full rounded-[10px] bg-canvas border border-border-card px-3.5 py-2 text-xs text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                  required
                />
                {targetInput && Number(targetInput) > 0 && (
                  <p className="font-mono text-xs text-starbucks-green font-bold mt-1">
                    {formatRupiah(Number(targetInput))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-black mb-1">
                  Saldo Awal Terkumpul (Opsional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0 jika belum ada"
                  value={initialSavedInput}
                  onChange={(e) => setInitialSavedInput(e.target.value)}
                  className="w-full rounded-[10px] bg-canvas border border-border-card px-3.5 py-2 text-xs text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-black mb-1">
                  Tenggat Waktu (Opsional)
                </label>
                <input
                  type="date"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  className="w-full rounded-[10px] bg-canvas border border-border-card px-3.5 py-2 text-xs text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                      <span>Simpan Target</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Update Saldo Tabungan */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-[16px] bg-white p-6 shadow-2xl border border-border-card text-text-black">
            <button
              type="button"
              onClick={() => setEditingGoal(null)}
              className="absolute top-4 right-4 text-text-black-soft hover:text-text-black p-1.5 rounded-full hover:bg-canvas transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-light text-starbucks-green">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-house-green">
                  Update Saldo Tabungan
                </h3>
                <p className="text-xs text-text-black-soft font-semibold">
                  {editingGoal.name}
                </p>
              </div>
            </div>

            <div className="rounded-[10px] bg-canvas p-3 border border-border-card mb-4 text-xs space-y-1">
              <div className="flex justify-between text-text-black-soft">
                <span>Target:</span>
                <span className="font-mono font-bold text-text-black">{formatRupiah(editingGoal.targetAmount)}</span>
              </div>
              <div className="flex justify-between text-text-black-soft">
                <span>Saldo saat ini:</span>
                <span className="font-mono font-bold text-starbucks-green">{formatRupiah(editingGoal.savedAmount)}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-[10px] bg-danger/10 p-3 text-xs text-danger font-medium border border-danger/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAmount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-black mb-1">
                  Saldo Terkumpul Baru (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={updateAmountInput}
                  onChange={(e) => setUpdateAmountInput(e.target.value)}
                  className="w-full rounded-[10px] bg-canvas border border-border-card px-3.5 py-2 text-sm text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                  required
                  autoFocus
                />
                {updateAmountInput && Number(updateAmountInput) > 0 && (
                  <p className="font-mono text-xs text-starbucks-green font-bold mt-1">
                    {formatRupiah(Number(updateAmountInput))}
                  </p>
                )}
              </div>

              {/* Quick Add Presets */}
              <div>
                <span className="block text-[11px] font-semibold text-text-black-soft mb-1.5">
                  Tambah Langsung ke Saldo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {addPresets.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        const current = Number(updateAmountInput) || 0;
                        setUpdateAmountInput((current + amt).toString());
                      }}
                      className="btn-pill text-[11px] px-2.5 py-1 bg-canvas hover:bg-green-light hover:text-starbucks-green text-text-black border border-border-card transition-colors cursor-pointer"
                    >
                      +{formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
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
                      <span>Simpan Saldo</span>
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
