import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";

export default function TasksLoading() {
  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      <DesktopSidebar />
      <Header householdName="Memuat..." />

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 animate-pulse space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-border-card rounded-full" />
            <div className="h-8 w-48 bg-border-card rounded-lg" />
          </div>
          <div className="h-9 w-28 bg-starbucks-green/30 rounded-full" />
        </div>

        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-[10px] bg-white border border-border-card shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-md bg-canvas shrink-0" />
                <div className="space-y-1.5">
                  <div
                    className="h-4 bg-border-card/70 rounded"
                    style={{ width: `${100 + (i % 3) * 40}px` }}
                  />
                  <div className="h-3 w-20 bg-canvas rounded" />
                </div>
              </div>
              <div className="h-6 w-16 bg-canvas rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
