import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar />

      {/* 2. Top Header Bar */}
      <Header householdName="Memuat..." />

      {/* 3. Main Content Skeleton Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 animate-pulse space-y-6">
        {/* Title & Tag */}
        <div className="space-y-2">
          <div className="h-3 w-28 bg-border-card rounded-full" />
          <div className="h-7 w-48 bg-border-card rounded-lg" />
        </div>

        {/* Top Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-28 rounded-[12px] bg-white border border-border-card p-4 space-y-3">
            <div className="h-4 w-24 bg-canvas rounded" />
            <div className="h-7 w-36 bg-border-card rounded" />
          </div>
          <div className="h-28 rounded-[12px] bg-white border border-border-card p-4 space-y-3">
            <div className="h-4 w-24 bg-canvas rounded" />
            <div className="h-7 w-36 bg-border-card rounded" />
          </div>
        </div>

        {/* Content Rows */}
        <div className="rounded-[12px] bg-white border border-border-card p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-border-card/40 last:border-0"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="h-8 w-8 rounded-full bg-canvas shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div
                    className="h-4 bg-border-card/70 rounded"
                    style={{ width: `${35 + (i % 3) * 20}%` }}
                  />
                  <div className="h-3 w-20 bg-canvas rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-canvas rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
