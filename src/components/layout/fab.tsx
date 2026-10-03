"use client";

import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
  label?: string;
}

export function FAB({ onClick, label = "Catat Transaksi Cepat" }: FABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-accent text-white shadow-starbucks-frap transition-all duration-200 hover:brightness-105 active:scale-95 cursor-pointer group"
    >
      <Plus className="h-6 w-6 stroke-[2.5] transition-transform group-hover:rotate-90" />
    </button>
  );
}
