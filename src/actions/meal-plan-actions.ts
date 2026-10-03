"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { deleteMealPlan, toggleMealCooked } from "@/lib/data/meal-plan";
import { MealSlot, AuditAction } from "@prisma/client";

export async function upsertMealPlanAction(formData: FormData) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const currentProfile = household.profiles[0];

    const planDateStr = (formData.get("planDate") as string)?.trim();
    const slot = (formData.get("slot") as MealSlot) || MealSlot.DINNER;
    const dishName = (formData.get("dishName") as string)?.trim();
    const recipeUrl = (formData.get("recipeUrl") as string)?.trim() || null;
    const ingredientsRaw = (formData.get("ingredients") as string)?.trim() || "";
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!planDateStr) {
      return { success: false, error: "Tanggal rencana wajib diisi" };
    }
    if (!dishName) {
      return { success: false, error: "Nama masakan / hidangan wajib diisi" };
    }

    const planDate = new Date(`${planDateStr}T00:00:00.000Z`);

    // Parse ingredients: split by newline or comma
    const ingredients = ingredientsRaw
      ? ingredientsRaw
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

    const meal = await prisma.mealPlan.upsert({
      where: {
        householdId_planDate_slot: {
          householdId: household.id,
          planDate,
          slot,
        },
      },
      update: {
        dishName,
        recipeUrl,
        ingredients,
        notes,
      },
      create: {
        householdId: household.id,
        planDate,
        slot,
        dishName,
        recipeUrl,
        ingredients,
        notes,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        householdId: household.id,
        actorId: currentProfile.id,
        entity: "MEAL_PLAN",
        entityId: meal.id,
        action: AuditAction.CREATE,
        diff: { planDate: planDateStr, slot, dishName, ingredientsCount: ingredients.length },
      },
    });

    revalidatePath("/meals");
    return { success: true, mealId: meal.id };
  } catch (error: any) {
    console.error("upsertMealPlanAction error:", error);
    return { success: false, error: error.message || "Gagal menyimpan rencana menu" };
  }
}

export async function toggleMealCookedAction(mealId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const isCooked = await toggleMealCooked(mealId, household.id);
    revalidatePath("/meals");
    return { success: true, isCooked };
  } catch (error: any) {
    console.error("toggleMealCookedAction error:", error);
    return { success: false, error: error.message || "Gagal mengubah status masakan" };
  }
}

export async function deleteMealPlanAction(mealId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    await deleteMealPlan(mealId, household.id);
    revalidatePath("/meals");
    return { success: true };
  } catch (error: any) {
    console.error("deleteMealPlanAction error:", error);
    return { success: false, error: error.message || "Gagal menghapus rencana menu" };
  }
}

export async function pushIngredientsToShoppingAction(formData: FormData) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const currentProfile = household.profiles[0];

    const shoppingListId = (formData.get("shoppingListId") as string)?.trim();
    const itemsJson = (formData.get("items") as string)?.trim();

    if (!shoppingListId) {
      return { success: false, error: "Pilih daftar belanja tujuan" };
    }

    let items: string[] = [];
    try {
      items = JSON.parse(itemsJson || "[]");
    } catch {
      return { success: false, error: "Format daftar bahan tidak valid" };
    }

    if (items.length === 0) {
      return { success: false, error: "Tidak ada bahan yang dipilih untuk dimasukkan ke belanja" };
    }

    // Verify shopping list belongs to household
    const list = await prisma.shoppingList.findFirst({
      where: { id: shoppingListId, householdId: household.id },
    });

    if (!list) {
      return { success: false, error: "Daftar belanja tidak ditemukan" };
    }

    // Get max sort_order currently in list
    const lastItem = await prisma.shoppingItem.findFirst({
      where: { listId: shoppingListId },
      orderBy: { sortOrder: "desc" },
    });
    let currentSort = (lastItem?.sortOrder ?? 0) + 1;

    // Create items in batch
    for (const itemName of items) {
      await prisma.shoppingItem.create({
        data: {
          householdId: household.id,
          listId: shoppingListId,
          name: itemName,
          checked: false,
          sortOrder: currentSort++,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        householdId: household.id,
        actorId: currentProfile.id,
        entity: "SHOPPING_ITEM",
        entityId: shoppingListId,
        action: AuditAction.CREATE,
        diff: { pushedFromMealPlan: true, count: items.length },
      },
    });

    revalidatePath("/shopping");
    revalidatePath("/meals");
    revalidatePath("/");

    return { success: true, count: items.length };
  } catch (error: any) {
    console.error("pushIngredientsToShoppingAction error:", error);
    return { success: false, error: error.message || "Gagal memasukkan bahan ke daftar belanja" };
  }
}
