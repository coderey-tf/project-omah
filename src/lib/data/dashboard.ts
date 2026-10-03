import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "./households";
import { getBillsForHousehold } from "./bills";
import { getBudgetsWithSpent } from "./budgets";
import { getSavingsGoals } from "./savings";

export async function getDashboardData() {
  const household = await getOrCreateDefaultHousehold();
  const householdId = household.id;

  // 1. Wallets with live calculated balance
  const wallets = await prisma.wallet.findMany({
    where: { householdId, deletedAt: null },
    include: {
      txFrom: {
        where: { deletedAt: null },
        select: { type: true, amount: true },
      },
      txTo: {
        where: { deletedAt: null },
        select: { amount: true },
      },
    },
  });

  const formattedWallets = wallets.map((w) => {
    let balance = Number(w.openingBalance);
    for (const t of w.txFrom) {
      if (t.type === "INCOME") balance += Number(t.amount);
      if (t.type === "EXPENSE") balance -= Number(t.amount);
      if (t.type === "TRANSFER") balance -= Number(t.amount);
    }
    for (const t of w.txTo) {
      balance += Number(t.amount);
    }
    return {
      id: w.id,
      name: w.name,
      type: w.type,
      balance,
    };
  });

  const totalBalance = formattedWallets.reduce((acc, w) => acc + w.balance, 0);

  // 2. Transactions & Period Spend
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactionsThisMonth = await prisma.transaction.findMany({
    where: {
      householdId,
      occurredOn: { gte: startOfMonth },
      deletedAt: null,
    },
    select: {
      amount: true,
      type: true,
      occurredOn: true,
    },
  });

  let periodSpent = 0;
  let monthlyIncome = 0;
  let todayExpense = 0;

  for (const t of transactionsThisMonth) {
    const amt = Number(t.amount);
    if (t.type === "EXPENSE") {
      periodSpent += amt;
      if (t.occurredOn >= startOfDay) {
        todayExpense += amt;
      }
    } else if (t.type === "INCOME") {
      monthlyIncome += amt;
    }
  }

  // 3. Budgets & Realization per Category
  const budgetSummary = await getBudgetsWithSpent(householdId);
  const periodBudget =
    budgetSummary.totalLimit > 0
      ? budgetSummary.totalLimit
      : 9000000; // default benchmark if not configured yet


  // 4. 3 Latest Transactions
  const recentTransactionsRaw = await prisma.transaction.findMany({
    where: { householdId, deletedAt: null },
    orderBy: { occurredOn: "desc" },
    take: 3,
    include: {
      wallet: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  const recentTransactions = recentTransactionsRaw.map((tx) => ({
    id: tx.id,
    description: tx.note || tx.category?.name || "Transaksi",
    amount: Number(tx.amount),
    type: tx.type,
    category: tx.category?.name || "Umum",
    walletName: tx.wallet.name,
    date: tx.occurredOn.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }));

  // 5. Active Bills with payment status
  const billsEnriched = await getBillsForHousehold(householdId);
  const bills = billsEnriched.map((b) => ({
    id: b.id,
    name: b.name,
    amount: b.amount,
    dueDate: b.dueDateFormatted,
    daysRemaining: b.daysRemaining,
    category: b.categoryName,
    categoryId: b.categoryId,
    period: b.period,
    dueDay: b.dueDay,
    isPaidThisCycle: b.isPaidThisCycle,
    isOverdue: b.isOverdue,
    lastPaidDueDate: b.lastPaidDueDate,
  }));

  // 6. Active Tasks sorted urgency-first
  const tasksRaw = await prisma.task.findMany({
    where: { householdId },
    orderBy: [{ doneAt: "asc" }, { dueDate: "asc" }],
    include: {
      assignee: { select: { displayName: true } },
    },
  });

  const tasks = tasksRaw.map((t) => {
    const isDueSoon = t.dueDate ? t.dueDate.getTime() - now.getTime() < 86400000 * 2 : false;
    const isCompleted = t.doneAt !== null;
    return {
      id: t.id,
      title: t.title,
      assignee: t.assignee?.displayName || "Bersama",
      dueDate: t.dueDate
        ? t.dueDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
        : "Fleksibel",
      isUrgent: isDueSoon && !isCompleted,
      completed: isCompleted,
      recurrence: t.recurrence !== "NONE" ? t.recurrence : undefined,
    };
  });

  // 7. Shopping List Items
  const shoppingList = await prisma.shoppingList.findFirst({
    where: { householdId, isArchived: false },
    include: {
      items: {
        orderBy: [{ checked: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  const shoppingItems = (shoppingList?.items || []).map((s) => ({
    id: s.id,
    name: s.name,
    quantity: s.quantity || "1",
    category: "Belanja",
    checked: s.checked,
  }));

  // 8. Categories for quick-add picker
  const categories = await prisma.category.findMany({
    where: { householdId, isArchived: false },
    select: { id: true, name: true, kind: true },
  });

  // 9. Savings Goals
  const savingsGoals = await getSavingsGoals(householdId);

  return {
    household: {
      id: household.id,
      name: household.name,
    },
    totalBalance,
    periodSpent,
    periodBudget,
    todayExpense,
    monthlyIncome,
    wallets: formattedWallets,
    recentTransactions,
    bills,
    budgetSummary,
    savingsGoals,
    tasks,
    shoppingItems,
    categories,
  };
}
