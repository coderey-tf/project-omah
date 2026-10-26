import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ShoppingCart } from "lucide-react";

export default function ShoppingLoading() {
  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar />

      {/* 2. Top Header Bar */}
      <Header householdName="Memuat..." />

      {/* 3. Main Content Skeleton Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 animate-pulse">
        <div className="space-y-5">
          {/* Header Title Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1.5">
              <div className="h-3 w-32 bg-border-card rounded-full" />
              <div className="h-8 w-64 bg-border-card rounded-lg" />
            </div>
          </div>

          {/* Progress Banner Skeleton */}
          <div className="rounded-[12px] bg-house-green p-5 shadow-starbucks-card relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-white/50" />
                <div className="h-5 w-32 bg-white/20 rounded-md" />
              </div>
              <div className="h-4 w-28 bg-white/20 rounded-full" />
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full w-1/3 bg-white/30 rounded-full animate-pulse" />
            </div>
            <div className="h-3 w-52 bg-white/20 rounded-full mt-3" />
          </div>

          {/* Add Item Form Skeleton */}
          <div className="rounded-[12px] bg-white p-4 border border-border-card shadow-starbucks-card flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="h-9 flex-1 bg-canvas rounded-full border border-border-input/50" />
            <div className="h-9 w-24 bg-canvas rounded-full border border-border-input/50" />
            <div className="h-9 w-28 bg-starbucks-green/30 rounded-full" />
          </div>

          {/* Items Checklist Skeletons */}
          <div className="space-y-2 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-[10px] bg-white border border-border-card shadow-2xs"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-5 w-5 rounded-full bg-border-card/60 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div
                      className="h-4 bg-border-card/70 rounded-md"
                      style={{ width: `${40 + (i % 3) * 20}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-14 bg-canvas rounded-full" />
                  <div className="h-6 w-6 bg-canvas rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
