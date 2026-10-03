import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { getAnnualAnalytics } from "@/lib/data/analytics";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan & Tren Tahunan — Omah",
  description: "Analisis arus kas 12 bulan, rasio tabungan, dan tren pengeluaran rumah tangga.",
};

interface AnalyticsPageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const household = await getOrCreateDefaultHousehold();
  const params = await searchParams;
  const targetYear = params.year ? parseInt(params.year, 10) : undefined;

  const data = await getAnnualAnalytics(household.id, targetYear);

  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar />

      {/* 2. Top Header Bar */}
      <Header householdName={household.name} />

      {/* 3. Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        <AnalyticsView data={data} />
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
