"use server";

import { CreateSavingsGoalSchema, UpdateSavingsAmountSchema } from "@/types/schemas";
import {
  createSavingsGoal,
  updateSavedAmount,
  deleteSavingsGoal,
} from "@/lib/data/savings";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { revalidatePath } from "next/cache";

export async function createSavingsGoalAction(input: unknown) {
  try {
    const parsed = CreateSavingsGoalSchema.parse(input);
    const household = await getOrCreateDefaultHousehold();

    const result = await createSavingsGoal(household.id, {
      name: parsed.name,
      targetAmount: parsed.targetAmount,
      savedAmount: parsed.savedAmount,
      deadline: parsed.deadline || null,
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return {
      success: true,
      message: "Target tabungan berhasil ditambahkan",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal membuat target tabungan",
    };
  }
}

export async function updateSavedAmountAction(input: unknown) {
  try {
    const parsed = UpdateSavingsAmountSchema.parse(input);
    const household = await getOrCreateDefaultHousehold();

    const result = await updateSavedAmount(
      parsed.goalId,
      household.id,
      parsed.savedAmount
    );

    revalidatePath("/");
    revalidatePath("/settings");

    return {
      success: true,
      message: "Saldo tabungan berhasil diperbarui",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memperbarui saldo tabungan",
    };
  }
}

export async function deleteSavingsGoalAction(goalId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    await deleteSavingsGoal(goalId, household.id);

    revalidatePath("/");
    revalidatePath("/settings");

    return {
      success: true,
      message: "Target tabungan berhasil dihapus",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menghapus target tabungan",
    };
  }
}
