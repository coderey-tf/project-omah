"use server";

import { CreateBudgetSchema } from "@/types/schemas";
import { upsertBudgetLimit } from "@/lib/data/budgets";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { revalidatePath } from "next/cache";

export async function setBudgetLimitAction(input: unknown) {
  try {
    const parsed = CreateBudgetSchema.parse(input);
    const household = await getOrCreateDefaultHousehold();

    const result = await upsertBudgetLimit(
      household.id,
      parsed.categoryId,
      parsed.limitAmount
    );

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return {
      success: true,
      message:
        parsed.limitAmount > 0
          ? "Limit anggaran berhasil disimpan"
          : "Limit anggaran berhasil dihapus (tanpa batas)",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengatur limit anggaran",
    };
  }
}
