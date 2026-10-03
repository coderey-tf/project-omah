"use client";

import { useState } from "react";
import { StatCluster } from "./stat-cluster";
import { TabKeuangan } from "./tab-keuangan";
import { TabAktivitas } from "./tab-aktivitas";
import { FAB } from "@/components/layout/fab";
import { QuickTransactionModal } from "./quick-transaction-modal";
import { Coins, CheckSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BudgetSummary } from "@/lib/data/budgets";
import type { EnrichedSavingsGoal } from "@/lib/data/savings";

interface DashboardViewProps {
  initialData?: {
    household: { id: string; name: string };
    totalBalance: number;
    periodSpent: number;
    periodBudget: number;
    todayExpense: number;
    monthlyIncome: number;
    wallets: Array<{ id: string; name: string; type: string; balance: number }>;
    recentTransactions: Array<{
      id: string;
      description: string;
      amount: number;
      type: "EXPENSE" | "INCOME" | "TRANSFER";
      category: string;
      walletName: string;
      date: string;
    }>;
    bills: Array<{
      id: string;
      name: string;
      amount: number;
      dueDate: string;
      daysRemaining: number;
      category: string;
      categoryId?: string | null;
      period?: "MONTHLY" | "YEARLY";
      dueDay?: number;
      isPaidThisCycle: boolean;
      isOverdue?: boolean;
      lastPaidDueDate?: string | null;
    }>;
    tasks: Array<{
      id: string;
      title: string;
      assignee: string;
      dueDate: string;
      isUrgent: boolean;
      completed: boolean;
      recurrence?: string;
    }>;
    shoppingItems: Array<{
      id: string;
      name: string;
      quantity: string;
      category: string;
      checked: boolean;
    }>;
    categories: Array<{ id: string; name: string; kind: string }>;
    budgetSummary?: BudgetSummary;
    savingsGoals?: EnrichedSavingsGoal[];
  };
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"keuangan" | "aktivitas">("keuangan");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="w-full">
      {/* 1. HERO STAT CLUSTER (HOUSE GREEN BAND + WHITE CARDS) */}
      <StatCluster
        totalBalance={initialData?.totalBalance}
        periodSpent={initialData?.periodSpent}
        periodBudget={initialData?.periodBudget}
        todayExpense={initialData?.todayExpense}
        monthlyIncome={initialData?.monthlyIncome}
      />

      {/* 2. SEGMENTED TAB SWITCHER (STARBUCKS PILL TABS) */}
      <div className="flex items-center justify-center my-6">
        <div className="inline-flex p-1 rounded-full bg-white shadow-starbucks-card border border-border-card max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("keuangan")}
            className={`btn-pill flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "keuangan"
                ? "bg-green-accent text-white shadow-sm"
                : "text-text-black-soft hover:text-text-black hover:bg-canvas"
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>KEUANGAN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("aktivitas")}
            className={`btn-pill flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "aktivitas"
                ? "bg-green-accent text-white shadow-sm"
                : "text-text-black-soft hover:text-text-black hover:bg-canvas"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>
              <span className="inline sm:hidden">AKTIVITAS</span>
              <span className="hidden sm:inline">AKTIVITAS (TUGAS & BELANJA)</span>
            </span>
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT */}
      <main className="transition-opacity duration-200">
        {activeTab === "keuangan" ? (
          <TabKeuangan
            initialBills={initialData?.bills}
            initialWallets={initialData?.wallets}
            initialTransactions={initialData?.recentTransactions}
            initialBudgets={initialData?.budgetSummary}
            initialSavingsGoals={initialData?.savingsGoals}
          />
        ) : (
          <TabAktivitas
            initialTasks={initialData?.tasks}
            initialShoppingItems={initialData?.shoppingItems}
          />
        )}
      </main>

      {/* 4. STARBUCKS FRAP FLOATING ACTION BUTTON */}
      <FAB onClick={() => setIsModalOpen(true)} />

      {/* 5. QUICK TRANSACTION MODAL (<10s SPEED) */}
      <QuickTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wallets={initialData?.wallets}
        categories={initialData?.categories}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
