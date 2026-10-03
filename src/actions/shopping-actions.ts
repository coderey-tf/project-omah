"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleShoppingItemAction(itemId: string, isChecked: boolean) {
  try {
    await prisma.shoppingItem.update({
      where: { id: itemId },
      data: {
        checked: isChecked,
        checkedAt: isChecked ? new Date() : null,
      },
    });
    revalidatePath("/");
    revalidatePath("/shopping");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengubah status belanja" };
  }
}

export async function addShoppingItemAction(input: {
  listId: string;
  name: string;
  quantity?: string;
}) {
  try {
    const list = await prisma.shoppingList.findUnique({
      where: { id: input.listId },
    });
    if (!list) throw new Error("Daftar belanja tidak ditemukan");

    // Find highest sortOrder
    const lastItem = await prisma.shoppingItem.findFirst({
      where: { listId: input.listId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const nextSort = (lastItem?.sortOrder ?? -1) + 1;

    const newItem = await prisma.shoppingItem.create({
      data: {
        householdId: list.householdId,
        listId: input.listId,
        name: input.name.trim(),
        quantity: input.quantity?.trim() || "1",
        checked: false,
        sortOrder: nextSort,
      },
    });

    revalidatePath("/");
    revalidatePath("/shopping");
    return { success: true, item: newItem };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menambah barang belanjaan" };
  }
}

export async function deleteShoppingItemAction(itemId: string) {
  try {
    await prisma.shoppingItem.delete({
      where: { id: itemId },
    });
    revalidatePath("/");
    revalidatePath("/shopping");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus barang" };
  }
}

export async function clearCheckedShoppingItemsAction(listId: string) {
  try {
    await prisma.shoppingItem.deleteMany({
      where: {
        listId,
        checked: true,
      },
    });
    revalidatePath("/");
    revalidatePath("/shopping");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal membersihkan daftar" };
  }
}
