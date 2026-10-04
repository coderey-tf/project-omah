"use client";

import { useState } from "react";
import { MealSlot } from "@/types/enums";
import type { MealPlanItem } from "@/lib/data/meal-plan";
import { AddMealModal } from "./add-meal-modal";
import { PushToShoppingModal } from "./push-to-shopping-modal";
import { toggleMealCookedAction, deleteMealPlanAction } from "@/actions/meal-plan-actions";
import {
  UtensilsCrossed,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Plus,
  CheckCircle2,
  Circle,
  ExternalLink,
  Trash2,
  Sparkles,
  ChefHat,
  CookingPot,
} from "lucide-react";

interface MealsViewProps {
  initialMeals: MealPlanItem[];
  allIngredients: { dishName: string; item: string; date: string }[];
  cookedCount: number;
  totalPlanned: number;
  shoppingLists: Array<{ id: string; name: string }>;
  currentWeekStart: string; // YYYY-MM-DD (Monday)
}

const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const SLOTS_CONFIG: { slot: MealSlot; label: string; icon: string; bg: string }[] = [
  { slot: MealSlot.BREAKFAST, label: "Sarapan", icon: "🌅", bg: "bg-amber-50/60 text-amber-900 border-amber-200/60" },
  { slot: MealSlot.LUNCH, label: "Makan Siang", icon: "☀️", bg: "bg-orange-50/60 text-orange-900 border-orange-200/60" },
  { slot: MealSlot.DINNER, label: "Makan Malam", icon: "🌙", bg: "bg-indigo-50/60 text-indigo-900 border-indigo-200/60" },
  { slot: MealSlot.SNACK, label: "Camilan", icon: "🍪", bg: "bg-emerald-50/60 text-emerald-900 border-emerald-200/60" },
];

export function MealsView({
  initialMeals,
  allIngredients,
  cookedCount,
  totalPlanned,
  shoppingLists,
  currentWeekStart,
}: MealsViewProps) {
  const [meals, setMeals] = useState<MealPlanItem[]>(initialMeals);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPushOpen, setIsPushOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<string>("");
  const [targetSlot, setTargetSlot] = useState<MealSlot>(MealSlot.DINNER);
  const [editingMeal, setEditingMeal] = useState<{
    dishName: string;
    recipeUrl?: string | null;
    ingredients?: string[];
    notes?: string | null;
  } | null>(null);

  // Compute 7 days of current viewed week based on weekOffset
  const baseDate = new Date(currentWeekStart);
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];
    return {
      dayName: DAY_NAMES[i],
      dateStr,
      formattedDate: `${d.getDate()} ${d.toLocaleString("id-ID", { month: "short" })}`,
      isToday: dateStr === todayStr,
    };
  });

  const handleToggleCooked = async (mealId: string) => {
    const res = await toggleMealCookedAction(mealId);
    if (res.success) {
      setMeals((prev) =>
        prev.map((m) => (m.id === mealId ? { ...m, isCooked: res.isCooked! } : m))
      );
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm("Hapus rencana menu ini?")) return;
    const res = await deleteMealPlanAction(mealId);
    if (res.success) {
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
    }
  };

  const openAddModal = (dateStr: string, slot: MealSlot) => {
    const existing = meals.find((m) => m.planDate === dateStr && m.slot === slot);
    setTargetDate(dateStr);
    setTargetSlot(slot);
    setEditingMeal(existing ? {
      dishName: existing.dishName,
      recipeUrl: existing.recipeUrl,
      ingredients: existing.ingredients,
      notes: existing.notes,
    } : null);
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-house-green text-white flex items-center justify-center shadow-md">
            <ChefHat className="h-7 w-7" />
          </div>
          <div>
            <span className="font-caption-mono text-xs text-starbucks-green font-bold tracking-wider uppercase">
              Fase 2 • Dapur & Perencanaan Makanan
            </span>
            <h1 className="text-2xl font-bold text-text-black tracking-tight">
              Meal Planner Mingguan
            </h1>
            <p className="text-xs text-text-black-soft mt-0.5">
              Rencana menu 7 hari, resep masakan, dan ekspor bahan belanja dalam 1 klik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPushOpen(true)}
            className="btn-pill px-4 py-2.5 bg-warm-sand hover:bg-warm-sand/80 text-house-green font-semibold flex items-center gap-1.5 text-xs border border-border-card transition-all"
          >
            <ShoppingCart className="h-4 w-4 text-starbucks-green" />
            <span>Kirim Bahan ke Belanja ({allIngredients.length})</span>
          </button>

          <button
            onClick={() => openAddModal(new Date().toISOString().split("T")[0], MealSlot.DINNER)}
            className="btn-pill px-5 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold flex items-center gap-2 text-xs shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Menu Direncanakan</p>
            <p className="text-xl font-bold text-text-black mt-0.5">{totalPlanned} Hidangan</p>
            <span className="text-[10px] text-text-black-soft">Sepanjang minggu ini</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-canvas flex items-center justify-center text-starbucks-green">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Selesai Dimasak</p>
            <p className="text-xl font-bold text-starbucks-green mt-0.5">{cookedCount} / {totalPlanned}</p>
            <span className="text-[10px] text-text-black-soft">
              {totalPlanned > 0 ? `${Math.round((cookedCount / totalPlanned) * 100)}% selesai` : "Belum ada rencana"}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-green-light/40 flex items-center justify-center text-starbucks-green">
            <CookingPot className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Bahan Dibutuhkan</p>
            <p className="text-xl font-bold text-house-green mt-0.5">{allIngredients.length} Bahan</p>
            <span className="text-[10px] text-text-black-soft">Siap disinkron ke belanja</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-canvas flex items-center justify-center text-house-green">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Week Navigator */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-border-card shadow-xs">
        <button
          onClick={() => setWeekOffset((prev) => prev - 1)}
          className="p-2 rounded-xl text-text-black-soft hover:bg-canvas hover:text-text-black transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Minggu Lalu</span>
        </button>

        <div className="flex items-center gap-2 text-center">
          <Calendar className="h-4 w-4 text-starbucks-green" />
          <span className="text-xs font-bold text-text-black">
            {weekDays[0].formattedDate} — {weekDays[6].formattedDate}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-2 text-[10px] font-bold text-starbucks-green px-2 py-0.5 rounded-md bg-green-light/40 hover:bg-green-light transition-colors"
            >
              Kembali ke Minggu Ini
            </button>
          )}
        </div>

        <button
          onClick={() => setWeekOffset((prev) => prev + 1)}
          className="p-2 rounded-xl text-text-black-soft hover:bg-canvas hover:text-text-black transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <span className="hidden sm:inline">Minggu Depan</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 4. 7-Day Meal Plan Grid */}
      <div className="space-y-4">
        {weekDays.map((day) => {
          const dayMeals = meals.filter((m) => m.planDate === day.dateStr);

          return (
            <div
              key={day.dateStr}
              className={`bg-white rounded-3xl p-5 border transition-all ${
                day.isToday
                  ? "border-starbucks-green shadow-md ring-1 ring-starbucks-green/30"
                  : "border-border-card shadow-xs"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-card">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-text-black">{day.dayName}</span>
                  <span className="text-xs text-text-black-soft font-caption-mono">{day.formattedDate}</span>
                  {day.isToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-starbucks-green text-white">
                      HARI INI
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-text-black-soft font-medium">
                  {dayMeals.length} / 4 Slot Terisi
                </span>
              </div>

              {/* Slots Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SLOTS_CONFIG.map((cfg) => {
                  const meal = dayMeals.find((m) => m.slot === cfg.slot);

                  return (
                    <div
                      key={cfg.slot}
                      className={`rounded-2xl p-3.5 border flex flex-col justify-between transition-all ${
                        meal
                          ? meal.isCooked
                            ? "bg-canvas/50 border-border-card opacity-80"
                            : "bg-white border-border-card hover:border-starbucks-green/60 shadow-xs"
                          : "bg-canvas/20 border-dashed border-border-card hover:border-starbucks-green/40 hover:bg-canvas/40"
                      }`}
                    >
                      <div>
                        {/* Slot Header */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.bg}`}
                          >
                            <span>{cfg.icon}</span>
                            <span>{cfg.label}</span>
                          </span>

                          {meal && (
                            <button
                              onClick={() => handleToggleCooked(meal.id)}
                              className={`p-1 rounded-lg transition-colors ${
                                meal.isCooked
                                  ? "text-starbucks-green hover:text-starbucks-green/80"
                                  : "text-text-black-soft hover:text-starbucks-green"
                              }`}
                              title={meal.isCooked ? "Tandai belum dimasak" : "Tandai sudah dimasak"}
                            >
                              {meal.isCooked ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Meal Details or Empty Action */}
                        {meal ? (
                          <div className="space-y-1.5">
                            <h4
                              className={`font-bold text-xs leading-tight ${
                                meal.isCooked ? "line-through text-text-black-soft" : "text-text-black"
                              }`}
                            >
                              {meal.dishName}
                            </h4>

                            {meal.ingredients.length > 0 && (
                              <p className="text-[10px] text-text-black-soft line-clamp-2">
                                🛒 {meal.ingredients.join(", ")}
                              </p>
                            )}

                            {meal.recipeUrl && (
                              <a
                                href={meal.recipeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-starbucks-green hover:underline pt-0.5"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Lihat Resep</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="py-3 text-center">
                            <button
                              onClick={() => openAddModal(day.dateStr, cfg.slot)}
                              className="inline-flex items-center gap-1 text-[11px] text-text-black-soft hover:text-starbucks-green font-medium transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Atur Menu</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Card Footer for filled meal */}
                      {meal && (
                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-border-card/60">
                          <button
                            onClick={() => openAddModal(day.dateStr, cfg.slot)}
                            className="text-[10px] font-semibold text-starbucks-green hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="text-text-black-soft hover:text-red-600 transition-colors p-0.5"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AddMealModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => window.location.reload()}
        defaultDate={targetDate}
        defaultSlot={targetSlot}
        existingMeal={editingMeal}
      />

      <PushToShoppingModal
        isOpen={isPushOpen}
        onClose={() => setIsPushOpen(false)}
        onSuccess={() => {
          alert("Bahan masakan berhasil dimasukkan ke daftar belanja!");
          window.location.reload();
        }}
        shoppingLists={shoppingLists}
        ingredients={allIngredients}
      />
    </div>
  );
}
