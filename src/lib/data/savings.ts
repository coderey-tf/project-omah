import { prisma } from "@/lib/prisma";

export interface EnrichedSavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  remaining: number;
  percentage: number;
  deadline: string | null;
  deadlineFormatted: string | null;
  daysLeft: number | null;
  isCompleted: boolean;
  createdAt: string;
}

/**
 * Mengambil daftar target tabungan aktif untuk household
 */
export async function getSavingsGoals(householdId: string): Promise<EnrichedSavingsGoal[]> {
  const goals = await prisma.savingsGoal.findMany({
    where: { householdId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return goals.map((g) => {
    const targetAmount = Number(g.targetAmount);
    const savedAmount = Number(g.savedAmount);
    const remaining = Math.max(0, targetAmount - savedAmount);
    const percentage = targetAmount > 0 ? Math.min(100, Math.round((savedAmount / targetAmount) * 100)) : 0;
    const isCompleted = savedAmount >= targetAmount;

    let deadlineFormatted: string | null = null;
    let daysLeft: number | null = null;

    if (g.deadline) {
      const deadlineDate = new Date(g.deadline);
      deadlineFormatted = deadlineDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const diffTime = deadlineDate.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      id: g.id,
      name: g.name,
      targetAmount,
      savedAmount,
      remaining,
      percentage,
      deadline: g.deadline ? g.deadline.toISOString() : null,
      deadlineFormatted,
      daysLeft,
      isCompleted,
      createdAt: g.createdAt.toISOString(),
    };
  });
}

/**
 * Membuat target tabungan baru
 */
export async function createSavingsGoal(
  householdId: string,
  data: {
    name: string;
    targetAmount: number;
    savedAmount?: number;
    deadline?: Date | string | null;
  }
) {
  const goal = await prisma.savingsGoal.create({
    data: {
      householdId,
      name: data.name,
      targetAmount: BigInt(data.targetAmount),
      savedAmount: BigInt(data.savedAmount || 0),
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  });

  return {
    id: goal.id,
    name: goal.name,
    targetAmount: Number(goal.targetAmount),
    savedAmount: Number(goal.savedAmount),
  };
}

/**
 * Memperbarui saldo terkumpul untuk target tabungan
 */
export async function updateSavedAmount(
  goalId: string,
  householdId: string,
  newAmount: number
) {
  const existing = await prisma.savingsGoal.findFirst({
    where: { id: goalId, householdId, deletedAt: null },
  });

  if (!existing) {
    throw new Error("Target tabungan tidak ditemukan");
  }

  const updated = await prisma.savingsGoal.update({
    where: { id: goalId },
    data: {
      savedAmount: BigInt(newAmount),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    targetAmount: Number(updated.targetAmount),
    savedAmount: Number(updated.savedAmount),
  };
}

/**
 * Hapus target tabungan (soft delete)
 */
export async function deleteSavingsGoal(goalId: string, householdId: string) {
  const existing = await prisma.savingsGoal.findFirst({
    where: { id: goalId, householdId, deletedAt: null },
  });

  if (!existing) {
    throw new Error("Target tabungan tidak ditemukan");
  }

  await prisma.savingsGoal.update({
    where: { id: goalId },
    data: {
      deletedAt: new Date(),
    },
  });

  return { success: true };
}
