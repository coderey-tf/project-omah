"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { CategoryKind } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(data: {
  name: string;
  kind: CategoryKind;
  icon?: string;
}) {
  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Nama kategori wajib diisi" };
    }

    const household = await getOrCreateDefaultHousehold();
    const cleanName = data.name.trim();

    // Check if category already exists in this household
    const existing = await prisma.category.findUnique({
      where: {
        householdId_kind_name: {
          householdId: household.id,
          kind: data.kind,
          name: cleanName,
        },
      },
    });

    if (existing) {
      if (existing.isArchived) {
        // Unarchive if it was archived
        const updated = await prisma.category.update({
          where: { id: existing.id },
          data: { isArchived: false },
        });
        revalidatePath("/");
        revalidatePath("/settings");
        revalidatePath("/transactions");
        return { success: true, category: updated };
      }
      return {
        success: false,
        error: `Kategori "${cleanName}" sudah terdaftar pada ${data.kind === "EXPENSE" ? "Pengeluaran" : "Pemasukan"}`,
      };
    }

    const category = await prisma.category.create({
      data: {
        householdId: household.id,
        name: cleanName,
        kind: data.kind,
        icon: data.icon || (data.kind === CategoryKind.INCOME ? "TrendingUp" : "Tag"),
      },
    });

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return {
      success: true,
      category: {
        id: category.id,
        name: category.name,
        kind: category.kind,
        icon: category.icon,
      },
    };
  } catch (error: any) {
    console.error("Gagal membuat kategori:", error);
    return {
      success: false,
      error: error.message || "Gagal menambahkan kategori",
    };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();

    const category = await prisma.category.findFirst({
      where: { id: categoryId, householdId: household.id },
    });

    if (!category) {
      return { success: false, error: "Kategori tidak ditemukan" };
    }

    // Check if category has transactions
    const txCount = await prisma.transaction.count({
      where: { categoryId, deletedAt: null },
    });

    // Check if category is used in recurring bills or budgets
    const billCount = await prisma.recurringBill.count({
      where: { categoryId, deletedAt: null },
    });
    const budgetCount = await prisma.budget.count({
      where: { categoryId },
    });

    if (txCount > 0 || billCount > 0 || budgetCount > 0) {
      // Archive to maintain transaction integrity
      await prisma.category.update({
        where: { id: categoryId },
        data: { isArchived: true },
      });
    } else {
      // Hard delete if clean
      await prisma.category.delete({
        where: { id: categoryId },
      });
    }

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error: any) {
    console.error("Gagal menghapus kategori:", error);
    return {
      success: false,
      error: error.message || "Gagal menghapus kategori",
    };
  }
}
