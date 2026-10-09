"use client";

import { RefreshCw, Users, Coffee, LogOut } from "lucide-react";
import { useState } from "react";
import { signOutAction } from "@/actions/auth-actions";

interface HeaderProps {
  householdName?: string;
  partnerName?: string;
}

export function Header({
  householdName = "Keluarga Bahagia",
  partnerName = "Suami & Istri",
}: HeaderProps) {
  const [isRotating, setIsRotating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleRefresh = () => {
    setIsRotating(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

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
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md shadow-starbucks-nav px-4 lg:px-8 py-3.5 transition-all">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        {/* Left: Brand & Household Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-house-green text-white shadow-sm">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-caption-mono text-[11px] text-starbucks-green tracking-wider font-semibold">
                OMAHKU · RUMAH TANGGA
              </span>
              <span className="inline-block h-2 w-2 rounded-full bg-green-accent animate-pulse" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-text-black tracking-tight leading-none mt-0.5 font-sans">
              {householdName}
            </h1>
          </div>
        </div>

        {/* Right: Partner Pill + Reload + Logout */}
        <div className="flex items-center gap-2">
          {/* Household Member Pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-xs text-text-black-soft font-medium">
            <Users className="h-3.5 w-3.5 text-starbucks-green" />
            <span>{partnerName}</span>
          </div>

          {/* Muat Ulang (Starbucks Outlined Pill) */}
          <button
            type="button"
            onClick={handleRefresh}
            title="Muat ulang data aplikasi"
            className="btn-pill flex items-center gap-1.5 border border-green-accent hover:bg-green-light/30 px-3.5 py-1.5 text-xs text-green-accent font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-green-accent ${isRotating ? "animate-spin" : ""}`}
            />
            <span>Muat Ulang</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Keluar dari sesi akun"
            className="btn-pill flex items-center gap-1.5 border border-border-card hover:border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs text-text-black-soft hover:text-red-600 font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isLoggingOut ? "..." : "Keluar"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
