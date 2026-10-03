import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { RemindersView } from "@/components/reminders/reminders-view";
import { getReminders } from "@/lib/data/reminders";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const household = await getOrCreateDefaultHousehold();
  const reminders = await getReminders(household.id);

  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar />

      {/* 2. Top Header Bar */}
      <Header householdName={household.name} />

      {/* 3. Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        <RemindersView initialReminders={reminders} />
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
