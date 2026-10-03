import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MealsView } from "@/components/meals/meals-view";
import { getWeekMealPlans } from "@/lib/data/meal-plan";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meal Planner Mingguan — Omah",
  description: "Perencanaan menu harian keluarga dan ekspor bahan masakan ke daftar belanja.",
};

export default async function MealsPage() {
  const household = await getOrCreateDefaultHousehold();

  // Calculate Monday of current week
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = monday.toISOString().split("T")[0];
  const sundayStr = sunday.toISOString().split("T")[0];

  const { meals, allIngredients, cookedCount, totalPlanned } = await getWeekMealPlans(
    household.id,
    mondayStr,
    sundayStr
  );

  // Fetch active shopping lists
  const shoppingLists = await prisma.shoppingList.findMany({
    where: { householdId: household.id, isArchived: false },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar />

      {/* 2. Top Header Bar */}
      <Header householdName={household.name} />

      {/* 3. Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        <MealsView
          initialMeals={meals}
          allIngredients={allIngredients}
          cookedCount={cookedCount}
          totalPlanned={totalPlanned}
          shoppingLists={shoppingLists}
          currentWeekStart={mondayStr}
        />
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
