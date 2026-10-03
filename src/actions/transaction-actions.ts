"use server";

import { prisma } from "@/lib/prisma";
import { CreateTransactionSchema } from "@/types/schemas";
import { revalidatePath } from "next/cache";
import { checkAndSendBudgetWarning } from "@/lib/data/budgets";

export async function createTransactionAction(input: unknown) {
  try {
    const parsed = CreateTransactionSchema.parse(input);

    // Verify wallet
    const wallet = await prisma.wallet.findUnique({
      where: { id: parsed.walletId },
    });
    if (!wallet) throw new Error("Dompet tidak ditemukan");

    // Retrieve default profile for the household
    const profile = await prisma.profile.findFirst({
      where: { householdId: wallet.householdId },
    });
    if (!profile) throw new Error("Profil pengguna tidak ditemukan");

    // Create transaction in database
    await prisma.transaction.create({
      data: {
        householdId: wallet.householdId,
        walletId: parsed.walletId,
        toWalletId: parsed.type === "TRANSFER" ? parsed.toWalletId : null,
        categoryId: parsed.type !== "TRANSFER" ? parsed.categoryId : null,
        amount: BigInt(parsed.amount),
        type: parsed.type,
        note: parsed.description || null,
        createdById: profile.id,
        occurredOn: new Date(parsed.occurredOn),
      },
    });

    // Check budget warning for EXPENSE transactions (asynchronous)
    if (parsed.type === "EXPENSE" && parsed.categoryId) {
      checkAndSendBudgetWarning(wallet.householdId, parsed.categoryId).catch((e) =>
        console.error("Budget check warning failed:", e)
      );
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mencatat transaksi" };
  }
}

