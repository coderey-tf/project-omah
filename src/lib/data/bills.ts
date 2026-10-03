import { prisma } from "@/lib/prisma";
import { CategoryKind } from "@prisma/client";

export interface EnrichedBill {
  id: string;
  name: string;
  amount: number;
  period: "MONTHLY" | "YEARLY";
  dueDay: number;
  dueMonth: number | null;
  remindDaysBefore: number[];
  categoryId: string | null;
  categoryName: string;
  lastPaidDueDate: string | null;
  isPaidThisCycle: boolean;
  dueDateFormatted: string;
  daysRemaining: number;
  isOverdue: boolean;
}

/**
 * Menghitung tanggal jatuh tempo siklus saat ini untuk sebuah tagihan
 */
export function getCurrentDueDate(
  bill: { period?: string; dueDay: number; dueMonth?: number | null },
  referenceDate = new Date()
): Date {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  if (bill.period === "YEARLY") {
    const dueMonth = (bill.dueMonth ? bill.dueMonth - 1 : 0);
    return new Date(year, dueMonth, bill.dueDay);
  }

  return new Date(year, month, bill.dueDay);
}

/**
 * Cek apakah tagihan sudah dibayar untuk siklus periode saat ini
 */
export function isPaidForCurrentCycle(
  bill: {
    lastPaidDueDate?: Date | null;
    period?: string;
    dueDay: number;
    dueMonth?: number | null;
  },
  referenceDate = new Date()
): boolean {
  if (!bill.lastPaidDueDate) return false;

  const targetDueDate = getCurrentDueDate(bill, referenceDate);
  const lastPaid = new Date(bill.lastPaidDueDate);

  if (bill.period === "YEARLY") {
    return lastPaid.getFullYear() >= targetDueDate.getFullYear();
  }

  // Untuk MONTHLY: bandingkan year dan month
  const targetYear = targetDueDate.getFullYear();
  const targetMonth = targetDueDate.getMonth();
  const paidYear = lastPaid.getFullYear();
  const paidMonth = lastPaid.getMonth();

  if (paidYear > targetYear) return true;
  if (paidYear === targetYear && paidMonth >= targetMonth) return true;

  return false;
}

/**
 * Ambil semua tagihan aktif untuk household dengan kalkulasi status siklus ini
 */
export async function getBillsForHousehold(householdId: string): Promise<EnrichedBill[]> {
  const rawBills = await prisma.recurringBill.findMany({
    where: { householdId, deletedAt: null },
    include: { category: true },
    orderBy: { dueDay: "asc" },
  });

  const now = new Date();
  const currentDay = now.getDate();

  return rawBills.map((b) => {
    const isPaid = isPaidForCurrentCycle(b, now);
    const targetDueDate = getCurrentDueDate(b, now);

    let daysRemaining = b.dueDay - currentDay;
    const isOverdue = !isPaid && daysRemaining < 0;

    if (isPaid && daysRemaining < 0) {
      // Jika sudah bayar dan tanggal sudah lewat, sisa hari untuk jatuh tempo bulan depan
      daysRemaining += 30;
    }

    const dueDateFormatted = targetDueDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      id: b.id,
      name: b.name,
      amount: Number(b.amount),
      period: b.period as "MONTHLY" | "YEARLY",
      dueDay: b.dueDay,
      dueMonth: b.dueMonth,
      remindDaysBefore: b.remindDaysBefore,
      categoryId: b.categoryId,
      categoryName: b.category?.name || "Utilitas Rumah",
      lastPaidDueDate: b.lastPaidDueDate ? b.lastPaidDueDate.toISOString() : null,
      isPaidThisCycle: isPaid,
      dueDateFormatted,
      daysRemaining,
      isOverdue,
    };
  });
}

/**
 * Tandai tagihan sebagai sudah dibayar untuk siklus saat ini
 * Opsional: buat transaksi EXPENSE di dompet yang dipilih
 */
export async function markBillAsPaid(
  billId: string,
  householdId: string,
  options?: {
    createTransaction?: boolean;
    walletId?: string;
    paidDate?: Date;
  }
) {
  const bill = await prisma.recurringBill.findFirst({
    where: { id: billId, householdId, deletedAt: null },
    include: { category: true },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan atau tidak memiliki akses");
  }

  const now = options?.paidDate || new Date();
  let targetDueDate = getCurrentDueDate(bill, now);

  // Jika untuk bulan ini sudah tercatat lunas, majukan ke siklus berikutnya
  if (bill.lastPaidDueDate) {
    const lastPaid = new Date(bill.lastPaidDueDate);
    if (
      lastPaid.getFullYear() === targetDueDate.getFullYear() &&
      lastPaid.getMonth() === targetDueDate.getMonth()
    ) {
      if (bill.period === "YEARLY") {
        targetDueDate = new Date(targetDueDate.getFullYear() + 1, targetDueDate.getMonth(), bill.dueDay);
      } else {
        targetDueDate = new Date(targetDueDate.getFullYear(), targetDueDate.getMonth() + 1, bill.dueDay);
      }
    }
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update status tagihan
    const updatedBill = await tx.recurringBill.update({
      where: { id: billId },
      data: {
        lastPaidDueDate: targetDueDate,
      },
    });

    // 2. Buat transaksi EXPENSE otomatis jika diminta
    let createdTx = null;
    if (options?.createTransaction) {
      let walletId = options.walletId;

      if (!walletId) {
        const firstWallet = await tx.wallet.findFirst({
          where: { householdId, deletedAt: null },
          orderBy: { createdAt: "asc" },
        });
        if (!firstWallet) {
          throw new Error("Tidak ada dompet aktif untuk mencatat pembayaran");
        }
        walletId = firstWallet.id;
      } else {
        const wallet = await tx.wallet.findFirst({
          where: { id: walletId, householdId, deletedAt: null },
        });
        if (!wallet) {
          throw new Error("Dompet yang dipilih tidak valid");
        }
      }

      // Kategori transaksi
      let categoryId = bill.categoryId;
      if (!categoryId) {
        const defaultCat = await tx.category.findFirst({
          where: { householdId, kind: CategoryKind.EXPENSE, isArchived: false },
        });
        categoryId = defaultCat ? defaultCat.id : null;
      }

      // Profile pencatat
      const profile = await tx.profile.findFirst({
        where: { householdId },
        orderBy: { role: "asc" },
      });
      if (!profile) {
        throw new Error("Profil pengguna tidak ditemukan");
      }

      createdTx = await tx.transaction.create({
        data: {
          householdId,
          walletId,
          categoryId,
          amount: bill.amount,
          type: "EXPENSE",
          note: `Pembayaran tagihan: ${bill.name}`,
          createdById: profile.id,
          occurredOn: options?.paidDate || new Date(),
        },
      });
    }

    return {
      bill: {
        ...updatedBill,
        amount: Number(updatedBill.amount),
      },
      transaction: createdTx
        ? { ...createdTx, amount: Number(createdTx.amount) }
        : null,
    };
  });
}

/**
 * Batalkan tanda lunas (kembalikan ke belum dibayar)
 */
export async function unmarkBillAsPaid(billId: string, householdId: string) {
  const bill = await prisma.recurringBill.findFirst({
    where: { id: billId, householdId, deletedAt: null },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan atau tidak memiliki akses");
  }

  const updatedBill = await prisma.recurringBill.update({
    where: { id: billId },
    data: {
      lastPaidDueDate: null,
    },
  });

  return {
    bill: {
      ...updatedBill,
      amount: Number(updatedBill.amount),
    },
  };
}
