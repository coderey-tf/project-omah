import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ShoppingView } from "@/components/shopping/shopping-view";
import { getShoppingPageData } from "@/lib/data/shopping";

export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const data = await getShoppingPageData();

  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar />

      {/* 2. Top Header Bar */}
      <Header householdName={data.householdName} />

      {/* 3. Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        <ShoppingView initialData={data} />
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
