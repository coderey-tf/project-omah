"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  toggleShoppingItemAction,
  addShoppingItemAction,
  deleteShoppingItemAction,
  clearCheckedShoppingItemsAction,
} from "@/actions/shopping-actions";
import { useRealtime } from "@/hooks/use-realtime";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}

interface ShoppingViewProps {
  initialData: {
    listId: string;
    listName: string;
    items: ShoppingItem[];
    checkedCount: number;
    totalCount: number;
    progressPercent: number;
  };
}

export function ShoppingView({ initialData }: ShoppingViewProps) {
  const [items, setItems] = useState<ShoppingItem[]>(initialData.items);

  useEffect(() => {
    setItems(initialData.items);
  }, [initialData.items]);

  useRealtime({
    table: "shopping_items",
    filter: `list_id=eq.${initialData.listId}`,
  });
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);
  const checkedCount = checkedItems.length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const handleToggle = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const nextChecked = !item.checked;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: nextChecked } : i))
    );
    await toggleShoppingItemAction(id, nextChecked);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const tempId = "temp-" + Date.now();
    const itemToAdd: ShoppingItem = {
      id: tempId,
      name: newName.trim(),
      quantity: newQty.trim() || "1",
      checked: false,
    };

    setItems((prev) => [itemToAdd, ...prev]);
    setNewName("");
    setNewQty("");

    try {
      const res = await addShoppingItemAction({
        listId: initialData.listId,
        name: itemToAdd.name,
        quantity: itemToAdd.quantity,
      });

      if (res.success && res.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === tempId ? { ...i, id: res.item.id } : i))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteShoppingItemAction(id);
  };

  const handleClearChecked = async () => {
    if (!confirm("Hapus semua barang yang sudah dicentang?")) return;
    setItems((prev) => prev.filter((i) => !i.checked));
    await clearCheckedShoppingItemsAction(initialData.listId);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="font-caption-mono text-[11px] text-starbucks-green font-bold tracking-wider uppercase">
            Checklist Belanja Rumah
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-house-green font-bold tracking-tight">
            {initialData.listName}
          </h1>
        </div>

        {checkedCount > 0 && (
          <button
            onClick={handleClearChecked}
            className="btn-pill inline-flex items-center gap-1.5 border border-border-card bg-white hover:bg-canvas px-4 py-2 text-xs font-semibold text-text-black-soft hover:text-red-600 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Bersihkan Selesai ({checkedCount})</span>
          </button>
        )}
      </div>

      {/* 2. Progress Banner */}
      <div className="rounded-[12px] bg-house-green text-white p-5 shadow-starbucks-card relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10 mb-2.5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-warm-gold" />
            <h3 className="font-serif text-lg font-bold text-white">Status Belanja</h3>
          </div>
          <span className="font-mono text-sm font-bold text-warm-gold">
            {checkedCount} / {totalCount} Barang ({progressPercent}%)
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden relative z-10">
          <div
            className="h-full bg-green-accent transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-white/70 mt-2 relative z-10">
          {progressPercent === 100 && totalCount > 0
            ? "Semua barang belanjaan sudah lengkap dibeli!"
            : `${uncheckedItems.length} barang lagi yang perlu dibeli di supermarket / pasar.`}
        </p>
      </div>

      {/* 3. Add Item Form */}
      <form
        onSubmit={handleAdd}
        className="rounded-[12px] bg-white p-4 border border-border-card shadow-starbucks-card flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tambah nama barang (cth: Minyak Goreng, Bawang Merah)..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full pl-4 pr-3 py-2 text-xs rounded-full border border-border-input bg-canvas text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent"
          />
        </div>

        <div className="w-full sm:w-32">
          <input
            type="text"
            placeholder="Jumlah (cth: 2 pouch)"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-full border border-border-input bg-canvas text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent text-center sm:text-left"
          />
        </div>

        <button
          type="submit"
          disabled={!newName.trim() || isSubmitting}
          className="btn-pill inline-flex items-center justify-center gap-1.5 bg-starbucks-green hover:bg-green-accent disabled:opacity-50 text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah</span>
        </button>
      </form>

      {/* 4. Shopping Items Checklist */}
      <div className="space-y-4">
        {/* Unchecked Items */}
        <div className="rounded-[12px] bg-white border border-border-card shadow-starbucks-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border-card bg-canvas/30 flex items-center justify-between">
            <span className="font-caption-mono text-xs font-semibold text-text-black-soft uppercase">
              Perlu Dibeli ({uncheckedItems.length})
            </span>
            <span className="text-[11px] text-starbucks-green font-medium">Klik untuk mencentang</span>
          </div>

          {uncheckedItems.length === 0 ? (
            <div className="py-12 text-center text-text-black-soft">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-accent mb-2 opacity-80" />
              <p className="text-sm font-medium text-text-black">Daftar belanja kosong!</p>
              <p className="text-xs text-text-black-soft mt-0.5">
                Bagus! Semua barang sudah dibeli atau belum ada daftar baru.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-card">
              {uncheckedItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 sm:px-5 py-3.5 flex items-center justify-between hover:bg-canvas/40 transition-colors group"
                >
                  <div
                    onClick={() => handleToggle(item.id)}
                    className="flex items-center gap-3.5 flex-1 cursor-pointer min-h-[44px]"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border-2 border-border-input hover:border-green-accent bg-white transition-colors">
                      {item.checked && <Check className="h-4 w-4 text-starbucks-green stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-black">{item.name}</p>
                      <span className="font-mono text-xs text-starbucks-green font-medium">
                        {item.quantity}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-text-black-soft hover:text-red-600 transition-colors rounded-full hover:bg-canvas cursor-pointer opacity-70 group-hover:opacity-100"
                    title="Hapus barang"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checked Items */}
        {checkedItems.length > 0 && (
          <div className="rounded-[12px] bg-white border border-border-card shadow-starbucks-card overflow-hidden opacity-85">
            <div className="px-5 py-3 border-b border-border-card bg-canvas/30 flex items-center justify-between">
              <span className="font-caption-mono text-xs font-semibold text-text-black-soft uppercase">
                Sudah Dibeli ({checkedItems.length})
              </span>
            </div>

            <div className="divide-y divide-border-card">
              {checkedItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between bg-canvas/20 hover:bg-canvas/50 transition-colors group"
                >
                  <div
                    onClick={() => handleToggle(item.id)}
                    className="flex items-center gap-3.5 flex-1 cursor-pointer min-h-[40px]"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-starbucks-green text-white">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-black-soft line-through">
                        {item.name}
                      </p>
                      <span className="font-mono text-xs text-text-black-soft">
                        {item.quantity}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-text-black-soft hover:text-red-600 transition-colors rounded-full hover:bg-canvas cursor-pointer opacity-50 group-hover:opacity-100"
                    title="Hapus barang"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
