import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

export default function TransactionsLoading() {
  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      <DesktopSidebar />
      <Header householdName="Memuat..." />

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 animate-pulse space-y-5">
        {/* Header & Action Button Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-border-card rounded-full" />
            <div className="h-8 w-44 bg-border-card rounded-lg" />
          </div>
          <div className="h-9 w-32 bg-starbucks-green/30 rounded-full" />
        </div>

        {/* Filter Pills Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-white border border-border-card rounded-full shrink-0" />
          ))}
        </div>

        {/* Transaction Items Skeleton */}
        <div className="rounded-[12px] bg-white border border-border-card p-4 shadow-starbucks-card space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 border-b border-border-card/40 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-canvas shrink-0" />
                <div className="space-y-1.5">
                  <div
                    className="h-4 bg-border-card/70 rounded"
                    style={{ width: `${90 + (i % 3) * 30}px` }}
                  />
                  <div className="h-3 w-24 bg-canvas rounded" />
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="h-4 w-20 bg-border-card/70 rounded ml-auto" />
                <div className="h-3 w-14 bg-canvas rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
