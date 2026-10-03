"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAction, signUpAction, loginWithTestingAccountAction } from "@/actions/auth-actions";
import { Mail, Lock, User, Eye, EyeOff, Coffee, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Zap } from "lucide-react";

interface LoginFormProps {
  isConfigured: boolean;
}

export function LoginForm({ isConfigured }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === "login") {
        const res = await signInAction(email, password);
        if (res.success) {
          router.push("/");
          router.refresh();
        } else {
          setError(res.error || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
        }
      } else {
        const res = await signUpAction(email, password, displayName || "Admin");
        if (res.success) {
          if (res.needEmailConfirmation) {
            setSuccessMessage("Pendaftaran berhasil! Cek email Anda untuk konfirmasi tautan masuk.");
          } else {
            setSuccessMessage("Pendaftaran berhasil! Mengalihkan ke Beranda...");
            setTimeout(() => {
              router.push("/");
              router.refresh();
            }, 1000);
          }
        } else {
          setError(res.error || "Gagal mendaftar. Silakan coba lagi.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Terjadi gangguan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginWithTestingAccountAction();
      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(res.error || "Gagal masuk dengan akun testing");
      }
    } catch (err: any) {
      setError(err.message || "Gagal masuk");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Branding */}
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-house-green text-white shadow-lg mb-3">
          <Coffee className="h-7 w-7" />
        </div>
        <span className="block font-caption-mono text-xs text-starbucks-green font-bold tracking-widest uppercase">
          OMAH · RUMAH TANGGA PRIVAT
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-house-green font-bold mt-1">
          {mode === "login" ? "Masuk ke Sistem" : "Buat Akun Keluarga"}
        </h1>
        <p className="text-xs text-text-black-soft mt-1.5 max-w-xs mx-auto">
          Kelola keuangan, daftar belanja, dan kebutuhan rumah bersama pasangan secara aman.
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-[16px] bg-white p-6 sm:p-8 border border-border-card shadow-starbucks-card">
        {/* Quick Testing Login Button */}
        <div className="mb-5 p-3.5 rounded-[12px] bg-green-light/40 border border-green-accent/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-caption-mono text-[10px] text-starbucks-green font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3 w-3 fill-starbucks-green" />
              AKUN UJI COBA (TESTING)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-house-green font-bold border border-border-card">
              INSTANT
            </span>
          </div>
          <p className="text-[11px] text-text-black-soft">
            Masuk langsung sebagai <b>Admin (Kepala Keluarga)</b> tanpa perlu konfigurasi email/password.
          </p>
          <button
            type="button"
            onClick={handleTestLogin}
            disabled={isLoading}
            className="btn-pill w-full inline-flex items-center justify-center gap-1.5 bg-house-green hover:bg-starbucks-green text-white py-2 px-3 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Masuk Cepat Akun Testing</span>
          </button>
        </div>

        <div className="relative flex py-1 items-center mb-4">
          <div className="flex-grow border-t border-border-card"></div>
          <span className="flex-shrink mx-3 font-caption-mono text-[10px] text-text-black-soft font-semibold uppercase">
            atau gunakan email
          </span>
          <div className="flex-grow border-t border-border-card"></div>
        </div>

        {/* Supabase Key Status Warning if not configured */}
        {!isConfigured && (
          <div className="mb-5 p-3 rounded-[10px] bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold block">Kunci Supabase Belum Terhubung</span>
              Silakan masukkan <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di file <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[11px]">.env</code> untuk mengaktifkan login cloud.
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-full bg-canvas p-1 mb-5 border border-border-card">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white text-house-green shadow-xs"
                : "text-text-black-soft hover:text-text-black"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              mode === "register"
                ? "bg-white text-house-green shadow-xs"
                : "text-text-black-soft hover:text-text-black"
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-[8px] bg-green-light border border-green-accent/30 text-xs text-house-green flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-starbucks-green" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-text-black-soft mb-1.5 uppercase font-caption-mono">
                Nama Panggilan
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Suami / Istri"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-[8px] border border-border-input bg-canvas text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-black-soft mb-1.5 uppercase font-caption-mono">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
              <input
                type="email"
                required
                placeholder="nama@keluarga.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-[8px] border border-border-input bg-canvas text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-black-soft mb-1.5 uppercase font-caption-mono">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-[8px] border border-border-input bg-canvas text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-black-soft hover:text-text-black p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-pill inline-flex items-center justify-center gap-2 w-full bg-starbucks-green hover:bg-green-accent disabled:opacity-50 text-white px-5 py-3 text-xs font-semibold shadow-sm transition-all cursor-pointer mt-2"
          >
            <span>
              {isLoading
                ? "Memproses..."
                : mode === "login"
                ? "Masuk ke Sistem"
                : "Daftar Akun Keluarga"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-1.5 text-text-black-soft text-[11px] mt-6">
        <ShieldCheck className="h-4 w-4 text-starbucks-green" />
        <span>Terenkripsi privat dengan Supabase Auth & PostgreSQL</span>
      </div>
    </div>
  );
}
