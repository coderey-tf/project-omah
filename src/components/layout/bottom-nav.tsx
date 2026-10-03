"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShoppingCart,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Beranda", href: "/", icon: LayoutDashboard },
  { name: "Transaksi", href: "/transactions", icon: ArrowLeftRight },
  { name: "Belanja", href: "/shopping", icon: ShoppingCart },
  { name: "Tugas", href: "/tasks", icon: CheckSquare },
  { name: "Lainnya", href: "/settings", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-card bg-white/95 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
      <div className="grid h-16 grid-cols-5 items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 transition-colors relative",
                isActive ? "text-starbucks-green" : "text-text-black-soft hover:text-text-black"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-105")} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-green-accent" />
                )}
              </div>
              <span className="font-sans text-[11px] font-semibold tracking-tight leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
