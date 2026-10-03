"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitationAction } from "@/actions/auth-actions";
import { User, CheckCircle2, ArrowRight } from "lucide-react";

interface InviteAcceptFormProps {
  rawToken: string;
  householdName: string;
  inviterName: string;
}

export function InviteAcceptForm({
  rawToken,
  householdName,
  inviterName,
}: InviteAcceptFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await acceptInvitationAction(rawToken, displayName.trim());
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        setError(res.error || "Gagal bergabung dengan rumah tangga");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-4 animate-in fade-in duration-300">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-light text-starbucks-green">
          <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-house-green">
            Berhasil Bergabung!
          </h3>
          <p className="text-xs text-text-black-soft mt-1">
            Selamat datang di <b>{householdName}</b>. Mengalihkan Anda ke Beranda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <span className="font-caption-mono text-[11px] text-starbucks-green font-bold uppercase">
          UNDANGAN DARI {inviterName.toUpperCase()}
        </span>
        <h2 className="font-serif text-xl font-bold text-house-green mt-0.5">
          {householdName}
        </h2>
        <p className="text-xs text-text-black-soft mt-1 leading-relaxed">
          Anda diundang sebagai anggota pasangan untuk mengelola keuangan, daftar belanja bersama, dan jadwal pekerjaan rumah.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-[8px] bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
          NAMA PANGGILAN ANDA
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
          <input
            type="text"
            required
            placeholder="Contoh: Istri / Sarah / Pasangan"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-[8px] border border-border-input bg-canvas text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!displayName.trim() || isSubmitting}
        className="btn-pill inline-flex items-center justify-center gap-2 w-full bg-starbucks-green hover:bg-green-accent disabled:opacity-50 text-white px-5 py-3 text-xs font-semibold shadow-sm transition-all cursor-pointer"
      >
        <span>{isSubmitting ? "Menghubungkan..." : "Terima Undangan & Masuk"}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
