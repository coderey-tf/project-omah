"use client";

import { useState, useEffect } from "react";
import { MealSlot } from "@/types/enums";
import { upsertMealPlanAction } from "@/actions/meal-plan-actions";
import {
  X,
  UtensilsCrossed,
  Calendar,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string;
  defaultSlot?: MealSlot;
  existingMeal?: {
    dishName: string;
    recipeUrl?: string | null;
    ingredients?: string[];
    notes?: string | null;
  } | null;
}

const SLOTS: { label: string; value: MealSlot; icon: string }[] = [
  { label: "Sarapan", value: MealSlot.BREAKFAST, icon: "🌅" },
  { label: "Makan Siang", value: MealSlot.LUNCH, icon: "☀️" },
  { label: "Makan Malam", value: MealSlot.DINNER, icon: "🌙" },
  { label: "Camilan / Snack", value: MealSlot.SNACK, icon: "🍪" },
];

export function AddMealModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  defaultSlot = MealSlot.DINNER,
  existingMeal,
}: AddMealModalProps) {
  const [planDate, setPlanDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [slot, setSlot] = useState<MealSlot>(defaultSlot);
  const [dishName, setDishName] = useState(existingMeal?.dishName || "");
  const [recipeUrl, setRecipeUrl] = useState(existingMeal?.recipeUrl || "");
  const [ingredients, setIngredients] = useState(existingMeal?.ingredients?.join("\n") || "");
  const [notes, setNotes] = useState(existingMeal?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultDate) setPlanDate(defaultDate);
    if (defaultSlot) setSlot(defaultSlot);
    if (existingMeal) {
      setDishName(existingMeal.dishName);
      setRecipeUrl(existingMeal.recipeUrl || "");
      setIngredients(existingMeal.ingredients?.join("\n") || "");
      setNotes(existingMeal.notes || "");
    } else {
      setDishName("");
      setRecipeUrl("");
      setIngredients("");
      setNotes("");
    }
  }, [defaultDate, defaultSlot, existingMeal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      setError("Nama masakan wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("planDate", planDate);
    formData.append("slot", slot);
    formData.append("dishName", dishName.trim());
    formData.append("recipeUrl", recipeUrl.trim());
    formData.append("ingredients", ingredients.trim());
    formData.append("notes", notes.trim());

    const res = await upsertMealPlanAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Gagal menyimpan menu");
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-border-card overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card bg-canvas/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-house-green text-white flex items-center justify-center shadow-sm">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text-black text-base">Rencanakan Menu Makanan</h3>
              <p className="text-xs text-text-black-soft">Atur hidangan dan catat bahan masakannya</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-text-black-soft hover:bg-canvas hover:text-text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {/* Date & Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Tanggal Rencana *
              </label>
              <input
                type="date"
                required
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Waktu Makan
              </label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value as MealSlot)}
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs font-medium"
              >
                {SLOTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dish Name */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Nama Hidangan / Masakan *
            </label>
            <input
              type="text"
              required
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="Contoh: Sayur Asem + Ikan Asin, Ayam Woku, Soto Ayam"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
            />
          </div>

          {/* Ingredients Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-text-black">
                Bahan-Bahan yang Perlu Dibeli (1 baris 1 bahan)
              </label>
              <span className="text-[10px] text-starbucks-green font-medium">Bisa dikirim ke Belanja</span>
            </div>
            <textarea
              rows={4}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Contoh:&#10;Daging ayam 1/2 kg&#10;Kacang panjang 1 ikat&#10;Bumbu racik sayur asem&#10;Jagung manis 2 buah"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs placeholder:text-text-black-soft/60 font-mono"
            />
          </div>

          {/* Recipe Link & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Tautan Resep / YouTube (Opsional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-black-soft" />
                <input
                  type="url"
                  value={recipeUrl}
                  onChange={(e) => setRecipeUrl(e.target.value)}
                  placeholder="https://cookpad.com/..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Catatan / Cara Masak Singkat
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="cth: Ungkep ayam dulu semalam sebelumnya"
                className="w-full px-3 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-full border border-border-card text-text-black font-medium hover:bg-canvas transition-colors text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-pill px-6 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold flex items-center gap-2 text-xs shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Menu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
