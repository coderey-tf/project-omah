import { prisma } from "@/lib/prisma";
import { MealSlot } from "@prisma/client";

export interface MealPlanItem {
  id: string;
  householdId: string;
  planDate: string; // YYYY-MM-DD
  slot: MealSlot;
  dishName: string;
  recipeUrl: string | null;
  ingredients: string[];
  notes: string | null;
  isCooked: boolean;
  createdAt: string;
}

export async function getWeekMealPlans(
  householdId: string,
  startDateStr: string,
  endDateStr: string
): Promise<{
  meals: MealPlanItem[];
  allIngredients: { dishName: string; item: string; date: string }[];
  cookedCount: number;
  totalPlanned: number;
}> {
  const start = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T23:59:59.999Z`);

  const records = await prisma.mealPlan.findMany({
    where: {
      householdId,
      planDate: {
        gte: start,
        lte: end,
      },
    },
    orderBy: [
      { planDate: "asc" },
      { slot: "asc" },
    ],
  });

  const allIngredients: { dishName: string; item: string; date: string }[] = [];
  let cookedCount = 0;

  const formatted: MealPlanItem[] = records.map((r) => {
    let ingList: string[] = [];
    if (r.ingredients && Array.isArray(r.ingredients)) {
      ingList = r.ingredients as string[];
    } else if (typeof r.ingredients === "string") {
      try {
        ingList = JSON.parse(r.ingredients);
      } catch {
        ingList = [r.ingredients];
      }
    }

    const dateStr = r.planDate.toISOString().split("T")[0];

    ingList.forEach((ing) => {
      if (ing.trim()) {
        allIngredients.push({
          dishName: r.dishName,
          item: ing.trim(),
          date: dateStr,
        });
      }
    });

    if (r.isCooked) {
      cookedCount++;
    }

    return {
      id: r.id,
      householdId: r.householdId,
      planDate: dateStr,
      slot: r.slot,
      dishName: r.dishName,
      recipeUrl: r.recipeUrl,
      ingredients: ingList,
      notes: r.notes,
      isCooked: r.isCooked,
      createdAt: r.createdAt.toISOString(),
    };
  });

  return {
    meals: formatted,
    allIngredients,
    cookedCount,
    totalPlanned: formatted.length,
  };
}

export async function deleteMealPlan(id: string, householdId: string) {
  const meal = await prisma.mealPlan.findFirst({
    where: { id, householdId },
  });

  if (!meal) {
    throw new Error("Rencana menu tidak ditemukan atau bukan milik household ini");
  }

  await prisma.mealPlan.delete({
    where: { id },
  });

  return true;
}

export async function toggleMealCooked(id: string, householdId: string) {
  const meal = await prisma.mealPlan.findFirst({
    where: { id, householdId },
  });

  if (!meal) {
    throw new Error("Rencana menu tidak ditemukan");
  }

  const updated = await prisma.mealPlan.update({
    where: { id },
    data: {
      isCooked: !meal.isCooked,
    },
  });

  return updated.isCooked;
}
