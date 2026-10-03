"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShoppingCart,
  CheckSquare,
  FileText,
  Shield,
  Car,
  Gift,
  UtensilsCrossed,
  TrendingUp,
  MoreHorizontal,
  Coffee,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/actions/auth-actions";

const NAV_ITEMS = [
  { name: "Beranda", href: "/", icon: LayoutDashboard },
  { name: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
  { name: "Belanja", href: "/shopping", icon: ShoppingCart },
  { name: "Tugas", href: "/tasks", icon: CheckSquare },
  { name: "Menu Makan", href: "/meals", icon: UtensilsCrossed },
  { name: "Analitik", href: "/analytics", icon: TrendingUp },
  { name: "Pengingat", href: "/reminders", icon: FileText },
  { name: "Brankas", href: "/vault", icon: Shield },
  { name: "Aset & Servis", href: "/assets", icon: Car },
  { name: "Kondangan", href: "/kondangan", icon: Gift },
  { name: "Lainnya", href: "/settings", icon: MoreHorizontal },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOutAction();
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <aside className="hidden md:flex fixed top-0 bottom-0 left-0 z-30 w-60 flex-col border-r border-border-card bg-white p-6 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-house-green text-white shadow-sm">
          <Coffee className="h-5 w-5" />
        </div>
        <div>
          <span className="font-caption-mono text-[10px] text-starbucks-green font-bold tracking-wider">
            OMAH SYSTEM
          </span>
          <h2 className="text-lg text-text-black tracking-tight font-semibold">
            Rumah Tangga
          </h2>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "btn-pill flex items-center gap-3 px-4 py-2.5 text-sm transition-all relative group",
                isActive
                  ? "bg-green-light/40 text-starbucks-green font-semibold"
                  : "text-text-black-soft hover:bg-canvas hover:text-text-black font-medium"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-starbucks-green" : "text-text-black-soft group-hover:text-text-black"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Indicator & Logout */}
      <div className="pt-4 pb-2 border-t border-border-card px-2 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-text-black-soft font-caption-mono">
          <span>STATUS</span>
          <span className="flex items-center gap-1.5 text-starbucks-green font-semibold">
            <span className="h-2 w-2 rounded-full bg-green-accent animate-pulse" />
            TERHUBUNG
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs font-semibold text-text-black-soft hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{isLoggingOut ? "Keluar..." : "Keluar dari Akun"}</span>
        </button>
      </div>
    </aside>
  );
}
