import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "./households";
import { TransactionType } from "@prisma/client";

export async function getTransactionsPageData(filters?: {
  type?: "ALL" | "EXPENSE" | "INCOME" | "TRANSFER";
  walletId?: string;
  categoryId?: string;
  searchQuery?: string;
}) {
  const household = await getOrCreateDefaultHousehold();
  const householdId = household.id;

  // 1. Wallets & Categories for filter options
  const wallets = await prisma.wallet.findMany({
    where: { householdId, deletedAt: null },
    select: { id: true, name: true, type: true },
  });

  const categories = await prisma.category.findMany({
    where: { householdId, isArchived: false },
    select: { id: true, name: true, kind: true, icon: true },
  });

  // 2. Query conditions
  const whereClause: any = {
    householdId,
    deletedAt: null,
  };

  if (filters?.type && filters.type !== "ALL") {
    whereClause.type = filters.type as TransactionType;
  }

  if (filters?.walletId && filters.walletId !== "ALL") {
    whereClause.OR = [
      { walletId: filters.walletId },
      { toWalletId: filters.walletId },
    ];
  }

  if (filters?.categoryId && filters.categoryId !== "ALL") {
    whereClause.categoryId = filters.categoryId;
  }

  if (filters?.searchQuery && filters.searchQuery.trim() !== "") {
    whereClause.note = {
      contains: filters.searchQuery.trim(),
      mode: "insensitive",
    };
  }

  // 3. Fetch Transactions
  const rawTransactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { occurredOn: "desc" },
    take: 100,
    include: {
      wallet: { select: { id: true, name: true } },
      toWallet: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, icon: true } },
      createdBy: { select: { displayName: true } },
    },
  });

  // 4. Calculate monthly / filtered totals
  let totalExpense = 0;
  let totalIncome = 0;

  const transactions = rawTransactions.map((tx) => {
    const amt = Number(tx.amount);
    if (tx.type === "EXPENSE") totalExpense += amt;
    if (tx.type === "INCOME") totalIncome += amt;

    return {
      id: tx.id,
      amount: amt,
      type: tx.type,
      note: tx.note || tx.category?.name || "Transaksi",
      categoryName: tx.category?.name || (tx.type === "TRANSFER" ? "Transfer Saldo" : "Umum"),
      categoryIcon: tx.category?.icon || null,
      walletName: tx.wallet.name,
      toWalletName: tx.toWallet?.name || null,
      occurredOn: tx.occurredOn.toISOString(),
      dateFormatted: tx.occurredOn.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      creatorName: tx.createdBy.displayName,
    };
  });

  return {
    householdName: household.name,
    wallets,
    categories,
    transactions,
    totalExpense,
    totalIncome,
    netFlow: totalIncome - totalExpense,
    count: transactions.length,
  };
}
