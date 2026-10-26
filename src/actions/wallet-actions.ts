"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { WalletType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createWalletAction(data: {
  name: string;
  type: WalletType;
  openingBalance: number;
}) {
  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Nama dompet atau rekening wajib diisi" };
    }

    const household = await getOrCreateDefaultHousehold();

    const wallet = await prisma.wallet.create({
      data: {
        householdId: household.id,
        name: data.name.trim(),
        type: data.type || WalletType.BANK,
        openingBalance: BigInt(Math.max(0, Math.round(data.openingBalance || 0))),
      },
    });

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return {
      success: true,
      wallet: {
        id: wallet.id,
        name: wallet.name,
        type: wallet.type,
        balance: Number(wallet.openingBalance),
      },
    };
  } catch (error: any) {
    console.error("Gagal membuat dompet:", error);
    return {
      success: false,
      error: error.message || "Gagal menambahkan dompet / rekening",
    };
  }
}

export async function deleteWalletAction(walletId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();

    // Check if wallet exists in this household
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, householdId: household.id },
    });

    if (!wallet) {
      return { success: false, error: "Dompet tidak ditemukan" };
    }

    // Check if wallet has transactions
    const txCount = await prisma.transaction.count({
      where: {
        OR: [{ walletId }, { toWalletId: walletId }],
        deletedAt: null,
      },
    });

    if (txCount > 0) {
      // Soft delete to protect financial records
      await prisma.wallet.update({
        where: { id: walletId },
        data: { deletedAt: new Date() },
      });
    } else {
      // Hard delete if clean
      await prisma.wallet.delete({
        where: { id: walletId },
      });
    }

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error: any) {
    console.error("Gagal menghapus dompet:", error);
    return {
      success: false,
      error: error.message || "Gagal menghapus dompet / rekening",
    };
  }
}
