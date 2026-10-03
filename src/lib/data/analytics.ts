import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export interface MonthlyCashflow {
  monthIndex: number; // 0 = Jan, 11 = Des
  monthName: string;
  shortName: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  icon: string | null;
  totalAmount: number;
  percentage: number;
}

export interface AnnualAnalyticsData {
  year: number;
  availableYears: number[];
  monthlyData: MonthlyCashflow[];
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  overallSavingsRate: number;
  averageMonthlyExpense: number;
  highestExpenseMonth: string | null;
  lowestExpenseMonth: string | null;
  categoryBreakdown: CategoryBreakdown[];
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export async function getAnnualAnalytics(
  householdId: string,
  targetYear?: number
): Promise<AnnualAnalyticsData> {
  const currentYear = new Date().getFullYear();
  const year = targetYear || currentYear;

  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

  // Fetch all transactions for this year
  const transactions = await prisma.transaction.findMany({
    where: {
      householdId,
      deletedAt: null,
      occurredOn: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      occurredOn: "asc",
    },
  });

  // Also discover available years
  const oldestTx = await prisma.transaction.findFirst({
    where: { householdId, deletedAt: null },
    orderBy: { occurredOn: "asc" },
    select: { occurredOn: true },
  });

  const startYear = oldestTx ? new Date(oldestTx.occurredOn).getFullYear() : currentYear;
  const availableYears: number[] = [];
  for (let y = startYear; y <= currentYear + 1; y++) {
    availableYears.push(y);
  }

  // Initialize 12 months data
  const monthlyData: MonthlyCashflow[] = Array.from({ length: 12 }, (_, i) => ({
    monthIndex: i,
    monthName: MONTH_NAMES[i],
    shortName: MONTH_SHORT[i],
    income: 0,
    expense: 0,
    net: 0,
    savingsRate: 0,
  }));

  // Map of categoryId -> total amount
  const categoryMap = new Map<string, { name: string; icon: string | null; total: number }>();

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    const m = new Date(tx.occurredOn).getMonth();
    const amount = Number(tx.amount);

    if (tx.type === TransactionType.INCOME) {
      monthlyData[m].income += amount;
      totalIncome += amount;
    } else if (tx.type === TransactionType.EXPENSE) {
      monthlyData[m].expense += amount;
      totalExpense += amount;

      if (tx.category) {
        const existing = categoryMap.get(tx.category.id) || {
          name: tx.category.name,
          icon: tx.category.icon,
          total: 0,
        };
        existing.total += amount;
        categoryMap.set(tx.category.id, existing);
      }
    }
  });

  // Calculate net and savings rate for each month
  let highestExpense = -1;
  let highestMonth = "";
  let lowestExpense = Infinity;
  let lowestMonth = "";

  monthlyData.forEach((m) => {
    m.net = m.income - m.expense;
    if (m.income > 0) {
      m.savingsRate = Math.max(0, Math.round(((m.income - m.expense) / m.income) * 100));
    } else {
      m.savingsRate = 0;
    }

    if (m.expense > highestExpense && m.expense > 0) {
      highestExpense = m.expense;
      highestMonth = m.monthName;
    }
    if (m.expense < lowestExpense && m.expense > 0) {
      lowestExpense = m.expense;
      lowestMonth = m.monthName;
    }
  });

  const netSavings = totalIncome - totalExpense;
  const overallSavingsRate =
    totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;
  const averageMonthlyExpense = Math.round(totalExpense / 12);

  // Category breakdown list
  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([id, cat]) => ({
      categoryId: id,
      categoryName: cat.name,
      icon: cat.icon,
      totalAmount: cat.total,
      percentage: totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    year,
    availableYears,
    monthlyData,
    totalIncome,
    totalExpense,
    netSavings,
    overallSavingsRate,
    averageMonthlyExpense,
    highestExpenseMonth: highestMonth || null,
    lowestExpenseMonth: lowestMonth || null,
    categoryBreakdown,
  };
}
