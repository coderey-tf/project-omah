import { prisma } from "@/lib/prisma";
import {
  CategoryKind,
  NotificationChannelType,
  NotificationEntity,
  NotificationStatus,
} from "@prisma/client";
import { formatRupiah } from "@/lib/utils";
import {
  sendTelegramMessage,
  formatBudgetTelegramMessage,
} from "@/lib/notifications/telegram";

export interface CategoryBudgetInfo {
  budgetId?: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "UNSET" | "SAFE" | "WARNING" | "EXCEEDED";
  effectiveFrom: string | null;
}

export interface BudgetSummary {
  periodStart: Date;
  periodEnd: Date;
  periodFormatted: string;
  totalLimit: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  categories: CategoryBudgetInfo[];
}

/**
 * Menghitung rentang tanggal periode anggaran berdasarkan periodStartDay household
 */
export function getPeriodBounds(periodStartDay = 1, referenceDate = new Date()) {
  const safeStartDay = Math.min(Math.max(1, periodStartDay), 28);
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let startMonth = day >= safeStartDay ? month : month - 1;
  let startYear = year;
  if (startMonth < 0) {
    startMonth = 11;
    startYear--;
  }

  const periodStart = new Date(startYear, startMonth, safeStartDay, 0, 0, 0, 0);

  let endMonth = startMonth + 1;
  let endYear = startYear;
  if (endMonth > 11) {
    endMonth = 0;
    endYear++;
  }
  const periodEnd = new Date(endYear, endMonth, safeStartDay, 0, 0, 0, 0);

  return { periodStart, periodEnd };
}

/**
 * Mengambil ringkasan anggaran dan realisasi pengeluaran per kategori
 */
export async function getBudgetsWithSpent(householdId: string): Promise<BudgetSummary> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { periodStartDay: true },
  });

  const periodStartDay = household?.periodStartDay || 1;
  const { periodStart, periodEnd } = getPeriodBounds(periodStartDay);

  // Ambil semua kategori pengeluaran aktif
  const categories = await prisma.category.findMany({
    where: { householdId, kind: CategoryKind.EXPENSE, isArchived: false },
    orderBy: { name: "asc" },
  });

  // Ambil total pengeluaran per kategori dalam periode ini
  const expensesGrouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      householdId,
      type: "EXPENSE",
      categoryId: { not: null },
      occurredOn: { gte: periodStart, lt: periodEnd },
      deletedAt: null,
    },
    _sum: { amount: true },
  });

  const spentMap = new Map<string, number>();
  for (const group of expensesGrouped) {
    if (group.categoryId) {
      spentMap.set(group.categoryId, Number(group._sum.amount || 0));
    }
  }

  let totalLimit = 0;
  let totalSpent = 0;

  const categoryBudgetInfos: CategoryBudgetInfo[] = [];

  for (const cat of categories) {
    // Cari budget dengan effectiveFrom terbesar yang <= periodStart
    const budget = await prisma.budget.findFirst({
      where: {
        categoryId: cat.id,
        effectiveFrom: { lte: periodStart },
      },
      orderBy: { effectiveFrom: "desc" },
    });

    const limit = budget ? Number(budget.limitAmount) : 0;
    const spent = spentMap.get(cat.id) || 0;
    const remaining = limit > 0 ? Math.max(0, limit - spent) : 0;
    const percentage = limit > 0 ? Math.min(999, Math.round((spent / limit) * 100)) : 0;

    let status: CategoryBudgetInfo["status"] = "UNSET";
    if (limit > 0) {
      if (percentage >= 100) status = "EXCEEDED";
      else if (percentage >= 80) status = "WARNING";
      else status = "SAFE";
    }

    if (limit > 0) {
      totalLimit += limit;
    }
    totalSpent += spent;

    categoryBudgetInfos.push({
      budgetId: budget?.id,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      limit,
      spent,
      remaining,
      percentage,
      status,
      effectiveFrom: budget?.effectiveFrom ? budget.effectiveFrom.toISOString() : null,
    });
  }

  // Urutkan: kategori dengan budget dan status bahaya/peringatan di atas, lalu yang ada limit, baru yang belum diset
  categoryBudgetInfos.sort((a, b) => {
    if (a.limit > 0 && b.limit === 0) return -1;
    if (a.limit === 0 && b.limit > 0) return 1;
    if (a.limit > 0 && b.limit > 0) return b.percentage - a.percentage;
    return a.categoryName.localeCompare(b.categoryName);
  });

  const totalRemaining = totalLimit > 0 ? Math.max(0, totalLimit - totalSpent) : 0;
  const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const startFormatted = periodStart.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
  const endFormatted = new Date(periodEnd.getTime() - 86400000).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

  return {
    periodStart,
    periodEnd,
    periodFormatted: `${startFormatted} – ${endFormatted}`,
    totalLimit,
    totalSpent,
    totalRemaining,
    overallPercentage,
    categories: categoryBudgetInfos,
  };
}

/**
 * Set atau update limit anggaran untuk kategori tertentu mulai periode saat ini
 */
export async function upsertBudgetLimit(
  householdId: string,
  categoryId: string,
  limitAmount: number
) {
  // Validasi kategori milik household dan tipe EXPENSE
  const category = await prisma.category.findFirst({
    where: { id: categoryId, householdId, kind: CategoryKind.EXPENSE, isArchived: false },
  });

  if (!category) {
    throw new Error("Kategori tidak valid atau tidak memiliki akses");
  }

  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { periodStartDay: true },
  });

  const periodStartDay = household?.periodStartDay || 1;
  const { periodStart } = getPeriodBounds(periodStartDay);

  const budget = await prisma.budget.upsert({
    where: {
      categoryId_effectiveFrom: {
        categoryId,
        effectiveFrom: periodStart,
      },
    },
    create: {
      householdId,
      categoryId,
      limitAmount: BigInt(limitAmount),
      effectiveFrom: periodStart,
    },
    update: {
      limitAmount: BigInt(limitAmount),
    },
  });

  return {
    id: budget.id,
    categoryId: budget.categoryId,
    limitAmount: Number(budget.limitAmount),
    effectiveFrom: budget.effectiveFrom.toISOString(),
  };
}

/**
 * Memeriksa ambang batas anggaran (80% / 100%) dan mengirimkan notifikasi Telegram real-time
 */
export async function checkAndSendBudgetWarning(
  householdId: string,
  categoryId: string
) {
  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        profiles: {
          include: {
            channels: {
              where: { isActive: true, channel: NotificationChannelType.TELEGRAM },
            },
          },
        },
      },
    });

    if (!household) return;

    const { periodStart, periodEnd } = getPeriodBounds(household.periodStartDay);

    const budget = await prisma.budget.findFirst({
      where: {
        categoryId,
        effectiveFrom: { lte: periodStart },
      },
      include: { category: true },
      orderBy: { effectiveFrom: "desc" },
    });

    if (!budget || Number(budget.limitAmount) <= 0) return;

    const limit = Number(budget.limitAmount);

    const categoryTxs = await prisma.transaction.aggregate({
      where: {
        householdId,
        categoryId,
        type: "EXPENSE",
        occurredOn: { gte: periodStart, lt: periodEnd },
        deletedAt: null,
      },
      _sum: { amount: true },
    });

    const spent = Number(categoryTxs._sum.amount || 0);
    const ratio = spent / limit;
    let slotThreshold = 0;

    if (ratio >= 1.0) {
      slotThreshold = 100;
    } else if (ratio >= 0.8) {
      slotThreshold = 80;
    }

    if (slotThreshold === 0) return;

    // Kirim notifikasi ke profil yang memiliki Telegram aktif
    for (const profile of household.profiles) {
      const telegramChannel = profile.channels.find(
        (c) => c.channel === NotificationChannelType.TELEGRAM && c.address
      );
      if (!telegramChannel?.address) continue;

      // Cek idempotency via NotificationLog
      const existingLog = await prisma.notificationLog.findUnique({
        where: {
          profileId_channel_entityType_entityId_dueDate_slot: {
            profileId: profile.id,
            channel: NotificationChannelType.TELEGRAM,
            entityType: NotificationEntity.BUDGET,
            entityId: budget.id,
            dueDate: periodStart,
            slot: slotThreshold,
          },
        },
      });

      if (existingLog && existingLog.status === NotificationStatus.SENT) {
        continue;
      }

      const messageText = formatBudgetTelegramMessage({
        householdName: household.name,
        categoryName: budget.category.name,
        spentFormatted: formatRupiah(spent),
        limitFormatted: formatRupiah(limit),
        percentage: Math.round(ratio * 100),
      });

      const sendResult = await sendTelegramMessage({
        chatId: telegramChannel.address,
        text: messageText,
      });

      await prisma.notificationLog.upsert({
        where: {
          profileId_channel_entityType_entityId_dueDate_slot: {
            profileId: profile.id,
            channel: NotificationChannelType.TELEGRAM,
            entityType: NotificationEntity.BUDGET,
            entityId: budget.id,
            dueDate: periodStart,
            slot: slotThreshold,
          },
        },
        create: {
          profileId: profile.id,
          householdId: household.id,
          channel: NotificationChannelType.TELEGRAM,
          entityType: NotificationEntity.BUDGET,
          entityId: budget.id,
          dueDate: periodStart,
          slot: slotThreshold,
          status: sendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
          attempts: 1,
          lastError: sendResult.error || null,
          sentAt: sendResult.ok ? new Date() : null,
        },
        update: {
          status: sendResult.ok ? NotificationStatus.SENT : NotificationStatus.FAILED,
          attempts: { increment: 1 },
          lastError: sendResult.error || null,
          sentAt: sendResult.ok ? new Date() : null,
        },
      });
    }
  } catch (error) {
    console.error("Gagal memeriksa atau mengirim peringatan anggaran:", error);
  }
}
