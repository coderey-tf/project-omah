"use client";

import { useState } from "react";
import { pushIngredientsToShoppingAction } from "@/actions/meal-plan-actions";
import {
  X,
  ShoppingCart,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  ListPlus,
} from "lucide-react";

interface PushToShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shoppingLists: Array<{ id: string; name: string }>;
  ingredients: Array<{ dishName: string; item: string; date: string }>;
}

export function PushToShoppingModal({
  isOpen,
  onClose,
  onSuccess,
  shoppingLists,
  ingredients,
}: PushToShoppingModalProps) {
  const [selectedListId, setSelectedListId] = useState(shoppingLists[0]?.id || "");
  const [selectedItems, setSelectedItems] = useState<string[]>(
    ingredients.map((ing) => ing.item)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleItem = (item: string) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === ingredients.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(ingredients.map((i) => i.item));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId) {
      setError("Pilih daftar belanja tujuan");
      return;
    }
    if (selectedItems.length === 0) {
      setError("Pilih setidaknya satu bahan untuk dimasukkan");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("shoppingListId", selectedListId);
    formData.append("items", JSON.stringify(selectedItems));

    const res = await pushIngredientsToShoppingAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Gagal memasukkan bahan ke daftar belanja");
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-border-card overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card bg-canvas/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-house-green text-white flex items-center justify-center shadow-sm">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text-black text-base">Kirim Bahan ke Daftar Belanja</h3>
              <p className="text-xs text-text-black-soft">Sinkronisasi otomatis ke modul belanja real-time</p>
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

          {/* Select Target Shopping List */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Pilih Daftar Belanja Tujuan *
            </label>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs font-medium"
            >
              {shoppingLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ingredients Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-black">
                Pilih Bahan yang Belum Tersedia di Dapur ({selectedItems.length}/{ingredients.length})
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[11px] font-semibold text-starbucks-green hover:underline"
              >
                {selectedItems.length === ingredients.length ? "Batal Semua" : "Pilih Semua"}
              </button>
            </div>

            {ingredients.length === 0 ? (
              <p className="p-4 bg-canvas/40 rounded-xl text-center text-xs text-text-black-soft">
                Belum ada bahan masakan yang dicatat pada menu minggu ini.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {ingredients.map((ing, idx) => {
                  const isChecked = selectedItems.includes(ing.item);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleItem(ing.item)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
                        isChecked
                          ? "border-starbucks-green bg-green-light/20 text-text-black"
                          : "border-border-card bg-canvas/20 text-text-black-soft hover:bg-canvas/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-starbucks-green shrink-0">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4 text-text-black-soft" />
                          )}
                        </span>
                        <span className="text-xs font-medium truncate">{ing.item}</span>
                      </div>
                      <span className="text-[10px] text-text-black-soft shrink-0 ml-2 bg-white px-2 py-0.5 rounded-md border border-border-card">
                        {ing.dishName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border-card">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-full border border-border-card text-text-black font-medium hover:bg-canvas transition-colors text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || selectedItems.length === 0}
              className="btn-pill px-6 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold flex items-center gap-2 text-xs shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memasukkan...</span>
                </>
              ) : (
                <>
                  <ListPlus className="h-4 w-4" />
                  <span>Masukkan {selectedItems.length} Bahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
