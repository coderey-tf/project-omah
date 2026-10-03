"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Wallet,
  Receipt,
  Calendar,
  Bell,
  Copy,
  Check,
  Coffee,
  Shield,
  Car,
  Gift,
  Tag,
  Plus,
  ExternalLink,
  FileText,
  ArrowRight,
  Download,
  UserMinus,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

import { createInvitationAction, removeMemberAction, signOutAction } from "@/actions/auth-actions";
import { NotificationChannelsCard, ProfileWithChannels } from "./notification-channels-card";

interface SettingsViewProps {
  initialData: {
    household: {
      id: string;
      name: string;
      periodStartDay: number;
      icalToken: string;
    };
    profiles: ProfileWithChannels[];
    wallets: Array<{
      id: string;
      name: string;
      type: string;
      balance: number;
    }>;
    bills: Array<{
      id: string;
      name: string;
      amount: number;
      dueDay: number;
      period: string;
      remindDaysBefore: number[];
      isPaidThisCycle?: boolean;
      lastPaidDueDate?: string | null;
      dueDateFormatted?: string;
    }>;
    categories: Array<{
      id: string;
      name: string;
      kind: string;
      icon: string | null;
    }>;
  };
}

export function SettingsView({ initialData }: SettingsViewProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialData.profiles);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; displayName: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
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

  useEffect(() => {
    setProfiles(initialData.profiles);
  }, [initialData.profiles]);

  const [copiedIcal, setCopiedIcal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [householdName, setHouseholdName] = useState(initialData.household.name);
  const [periodDay, setPeriodDay] = useState(initialData.household.periodStartDay);

  const icalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/ical/${initialData.household.icalToken}`
    : `/api/ical/${initialData.household.icalToken}`;

  const copyIcalUrl = () => {
    navigator.clipboard.writeText(icalUrl);
    setCopiedIcal(true);
    setTimeout(() => setCopiedIcal(false), 2000);
  };

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    try {
      const res = await createInvitationAction(initialData.household.id);
      if (res.success && res.rawToken) {
        const fullLink = `${window.location.origin}/invite/${res.rawToken}`;
        setInviteLink(fullLink);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const copyInviteUrl = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove || isRemoving) return;
    setIsRemoving(true);
    setRemoveError(null);

    try {
      const res = await removeMemberAction(initialData.household.id, memberToRemove.id);
      if (res.success) {
        setProfiles((prev) => prev.filter((p) => p.id !== memberToRemove.id));
        setMemberToRemove(null);
        router.refresh();
      } else {
        setRemoveError(res.error || "Gagal mengeluarkan anggota");
      }
    } catch (err: any) {
      setRemoveError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsRemoving(false);
    }
  };

  const expenseCategories = initialData.categories.filter((c) => c.kind === "EXPENSE");
  const incomeCategories = initialData.categories.filter((c) => c.kind === "INCOME");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Page Title */}
      <div>
        <span className="font-caption-mono text-[11px] text-starbucks-green font-bold tracking-wider uppercase">
          Konfigurasi Rumah Tangga
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl text-house-green font-bold tracking-tight">
          Pengaturan & Anggota
        </h1>
        <p className="text-xs text-text-black-soft mt-1">
          Kelola profil keluarga, dompet kas bersama, tagihan bulanan, dan integrasi notifikasi.
        </p>
      </div>

      {/* 2. Members & Household Card */}
      <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-starbucks-green">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-house-green">
                Anggota Rumah Tangga
              </h3>
              <p className="text-xs text-text-black-soft">Maksimal 2 anggota (Suami & Istri)</p>
            </div>
          </div>
          <span className="font-caption-mono text-[11px] px-2.5 py-1 rounded-full bg-green-light text-starbucks-green font-bold">
            {profiles.length} / 2 ANGGOTA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between p-3.5 rounded-[10px] bg-canvas border border-border-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-house-green text-white font-bold text-sm">
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-black">{profile.displayName}</p>
                  <span className="text-[11px] text-text-black-soft">
                    Bergabung {profile.joinedAt}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-caption-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    profile.role === "ADMIN"
                      ? "bg-warm-gold/20 text-warm-gold border border-warm-gold/30"
                      : "bg-white text-text-black-soft border border-border-card"
                  }`}
                >
                  {profile.role}
                </span>

                {profile.role !== "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberToRemove({ id: profile.id, displayName: profile.displayName });
                      setRemoveError(null);
                    }}
                    title="Keluarkan anggota dari rumah tangga"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    <span>Keluarkan</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Invite Partner Section (if < 2 members) */}
        {profiles.length < 2 && (
          <div className="p-4 rounded-[10px] bg-green-light/30 border border-green-accent/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-house-green">Undang Pasangan</p>
                <p className="text-[11px] text-text-black-soft">
                  Kirim tautan privat sekali pakai untuk menghubungkan pasangan ke rumah tangga ini.
                </p>
              </div>
              {!inviteLink && (
                <button
                  type="button"
                  disabled={isGeneratingInvite}
                  onClick={handleGenerateInvite}
                  className="btn-pill bg-starbucks-green hover:bg-green-accent text-white px-4 py-2 text-xs font-semibold shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  {isGeneratingInvite ? "Membuat..." : "Buat Tautan Undangan"}
                </button>
              )}
            </div>

            {inviteLink && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 rounded-[8px] border border-border-input bg-white px-3 py-2 text-xs font-mono text-text-black select-all"
                />
                <button
                  type="button"
                  onClick={copyInviteUrl}
                  className="btn-pill inline-flex items-center gap-1.5 bg-starbucks-green hover:bg-green-accent text-white px-3.5 py-2 text-xs font-semibold cursor-pointer shrink-0"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Budget Period & iCal Subscription */}
      <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-gold/20 text-warm-gold">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-house-green">
              Periode Anggaran & Feed Kalender
            </h3>
            <p className="text-xs text-text-black-soft">Sinkronisasi tagihan dan anggaran</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
              HARI AWAL PERIODE GAJIAN / ANGGARAN
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={28}
                value={periodDay}
                onChange={(e) => setPeriodDay(Number(e.target.value))}
                className="w-24 rounded-[8px] border border-border-input bg-canvas px-3 py-2 text-xs font-bold text-text-black focus:outline-none focus:border-green-accent"
              />
              <span className="text-xs text-text-black-soft">
                Tiap tanggal {periodDay} setiap bulan
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
              SUBSCRIBE KALENDER (iCAL / GOOGLE CALENDAR)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={icalUrl}
                className="flex-1 rounded-[8px] border border-border-input bg-canvas px-3 py-2 text-xs font-mono text-text-black-soft truncate select-all"
              />
              <button
                type="button"
                onClick={copyIcalUrl}
                className="btn-pill inline-flex items-center gap-1.5 bg-starbucks-green hover:bg-green-accent text-white px-3.5 py-2 text-xs font-semibold cursor-pointer shrink-0"
              >
                {copiedIcal ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Automated Notification Channels (Telegram & WhatsApp) */}
      <NotificationChannelsCard profiles={profiles} />

      {/* 5. Wallets Management */}
      <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-starbucks-green">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-house-green">
                Dompet & Rekening Aktif
              </h3>
              <p className="text-xs text-text-black-soft">Sumber dana pengeluaran dan simpanan</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {initialData.wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="p-4 rounded-[10px] bg-canvas border border-border-card flex flex-col justify-between"
            >
              <div>
                <span className="font-caption-mono text-[10px] px-2 py-0.5 rounded-full bg-white border border-border-card text-text-black-soft font-bold">
                  {wallet.type}
                </span>
                <p className="text-sm font-bold text-text-black mt-2 leading-tight">
                  {wallet.name}
                </p>
              </div>
              <p className="font-mono text-base font-bold text-starbucks-green mt-3">
                {formatRupiah(wallet.balance)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recurring Bills */}
      <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-warm-gold">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-house-green">
                Tagihan Berulang Terdaftar
              </h3>
              <p className="text-xs text-text-black-soft">Jatuh tempo bulanan otomatis</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {initialData.bills.map((bill) => (
            <div
              key={bill.id}
              className="p-3.5 rounded-[10px] bg-canvas border border-border-card flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-text-black">{bill.name}</p>
                  <span
                    className={`btn-pill text-[10px] px-2 py-0.5 font-bold ${
                      bill.isPaidThisCycle
                        ? "bg-green-light text-starbucks-green"
                        : "bg-warning/20 text-yellow-800"
                    }`}
                  >
                    {bill.isPaidThisCycle ? "Lunas" : "Belum Bayar"}
                  </span>
                </div>
                <span className="text-xs text-text-black-soft block mt-0.5">
                  Jatuh tempo tgl {bill.dueDay} • Ingatkan H-{bill.remindDaysBefore.join(", H-")}
                </span>
              </div>
              <p className="font-mono text-sm font-bold text-text-black">
                {formatRupiah(bill.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Document Reminders Quick Access */}
      <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-light text-starbucks-green">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-house-green">
              Pengingat Dokumen & Tenggat
            </h3>
            <p className="text-xs text-text-black-soft">
              Kelola jadwal pajak STNK, paspor, polis asuransi, dan dokumen berkala
            </p>
          </div>
        </div>
        <Link
          href="/reminders"
          className="btn-pill flex items-center justify-center gap-1.5 bg-starbucks-green hover:bg-house-green text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap self-start sm:self-center"
        >
          <span>Buka Pengingat Dokumen</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 7. Categories List */}

      <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-starbucks-green">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-house-green">
              Kategori Transaksi
            </h3>
            <p className="text-xs text-text-black-soft">Digunakan untuk klasifikasi arus kas</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="block text-xs font-semibold text-text-black-soft mb-2">
              PENGELUARAN ({expenseCategories.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((c) => (
                <span
                  key={c.id}
                  className="btn-pill px-3 py-1 text-xs border border-border-card bg-canvas text-text-black font-medium"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border-card">
            <span className="block text-xs font-semibold text-text-black-soft mb-2">
              PEMASUKAN ({incomeCategories.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {incomeCategories.map((c) => (
                <span
                  key={c.id}
                  className="btn-pill px-3 py-1 text-xs border border-green-accent/30 bg-green-light/40 text-starbucks-green font-semibold"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 8. Ruang Dokumen & Inventaris (Fase 2) */}
      <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-starbucks-green">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-house-green">
                Ruang Dokumen & Inventaris
              </h3>
              <p className="text-xs text-text-black-soft">
                Penyimpanan digital privat berkas penting & pengingat masa berlaku
              </p>
            </div>
          </div>
          <span className="font-caption-mono text-[10px] px-2 py-0.5 rounded-full bg-green-light text-starbucks-green font-bold">
            FASE 2 AKTIF
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/vault"
            className="p-3.5 rounded-[10px] bg-canvas border border-border-card hover:border-starbucks-green transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-starbucks-green border border-border-card">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-house-green group-hover:text-starbucks-green transition-colors">
                  Brankas Dokumen Keluarga
                </p>
                <p className="text-[11px] text-text-black-soft">
                  Salinan KTP, KK, BPKB, STNK & Polis Asuransi
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-black-soft group-hover:text-starbucks-green group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/assets"
            className="p-3.5 rounded-[10px] bg-canvas border border-border-card hover:border-starbucks-green transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-starbucks-green border border-border-card">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-house-green group-hover:text-starbucks-green transition-colors">
                  Aset & Servis Kendaraan
                </p>
                <p className="text-[11px] text-text-black-soft">
                  Inventaris elektronik, garansi & servis berkala
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-black-soft group-hover:text-starbucks-green group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/kondangan"
            className="p-3.5 rounded-[10px] bg-canvas border border-border-card hover:border-starbucks-green transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-starbucks-green border border-border-card">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-house-green group-hover:text-starbucks-green transition-colors">
                  Buku Catatan Kondangan & Angpao
                </p>
                <p className="text-[11px] text-text-black-soft">
                  Rekam jejak timbal balik amplop hajatan kerabat
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-black-soft group-hover:text-starbucks-green group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/reminders"
            className="p-3.5 rounded-[10px] bg-canvas border border-border-card hover:border-starbucks-green transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-starbucks-green border border-border-card">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-house-green group-hover:text-starbucks-green transition-colors">
                  Pengingat Tanggal Jatuh Tempo
                </p>
                <p className="text-[11px] text-text-black-soft">
                  STNK, Pajak Tahunan, Asuransi & Garansi
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-black-soft group-hover:text-starbucks-green group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

      {/* 9. Ekspor Data Cadangan (CSV) */}
      <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-starbucks-green">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-house-green">
                Cadangan & Ekspor Data (CSV)
              </h3>
              <p className="text-xs text-text-black-soft">
                Unduh salinan data rumah tangga untuk Microsoft Excel atau Google Sheets
              </p>
            </div>
          </div>
          <span className="font-caption-mono text-[10px] px-2 py-0.5 rounded-full bg-warm-sand text-house-green font-bold">
            EXCEL READY (UTF-8)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-[10px] bg-canvas border border-border-card flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-house-green">Riwayat Transaksi</p>
              <p className="text-[11px] text-text-black-soft mt-1 leading-relaxed">
                Seluruh arus kas pemasukan, pengeluaran, dan transfer dompet.
              </p>
            </div>
            <a
              href="/api/export/csv?type=transactions"
              download
              className="mt-3 btn-pill inline-flex items-center justify-center gap-1.5 bg-white hover:bg-warm-sand border border-border-card text-house-green text-[11px] font-semibold py-2 transition-all cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-starbucks-green" />
              <span>Unduh Transaksi</span>
            </a>
          </div>

          <div className="p-3.5 rounded-[10px] bg-canvas border border-border-card flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-house-green">Anggaran & Realisasi</p>
              <p className="text-[11px] text-text-black-soft mt-1 leading-relaxed">
                Limit anggaran per kategori dan perbandingan sisa bulan ini.
              </p>
            </div>
            <a
              href="/api/export/csv?type=budgets"
              download
              className="mt-3 btn-pill inline-flex items-center justify-center gap-1.5 bg-white hover:bg-warm-sand border border-border-card text-house-green text-[11px] font-semibold py-2 transition-all cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-starbucks-green" />
              <span>Unduh Anggaran</span>
            </a>
          </div>

          <div className="p-3.5 rounded-[10px] bg-canvas border border-border-card flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-house-green">Tagihan Rutin & Siklus</p>
              <p className="text-[11px] text-text-black-soft mt-1 leading-relaxed">
                Daftar tagihan rutin, nominal, jatuh tempo, dan status lunas siklus.
              </p>
            </div>
            <a
              href="/api/export/csv?type=bills"
              download
              className="mt-3 btn-pill inline-flex items-center justify-center gap-1.5 bg-white hover:bg-warm-sand border border-border-card text-house-green text-[11px] font-semibold py-2 transition-all cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-starbucks-green" />
              <span>Unduh Tagihan</span>
            </a>
          </div>
        </div>
      </div>

      {/* 9. Akun & Keamanan Sesi */}
      <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-house-green">
                Sesi Akun & Keamanan
              </h3>
              <p className="text-xs text-text-black-soft">
                Kelola status sesi login dan akses perangkat ke Omah
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[10px] bg-canvas border border-border-card">
          <div>
            <p className="text-xs font-bold text-text-black">Keluar dari Perangkat Ini</p>
            <p className="text-[11px] text-text-black-soft">
              Mengakhiri sesi masuk aktif dan mengunci akses dashboard hingga Anda login kembali.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn-pill inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isLoggingOut ? "Keluar..." : "Keluar dari Akun"}</span>
          </button>
        </div>
      </div>

      {/* 10. System & Design System Footer Banner */}
      <div className="rounded-[12px] bg-canvas-soft border border-border-card p-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-house-green text-white">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-house-green">
              Project Omah — Starbucks Heritage Edition
            </h4>
            <p className="text-xs text-text-black-soft">
              House Green #1E3932 • Starbucks Green #006241 • Warm Cream #f2f0eb • Dual Shadow Cards
            </p>
          </div>
        </div>

        <span className="font-caption-mono text-[11px] px-3 py-1 rounded-full bg-white border border-border-card text-starbucks-green font-bold">
          PRISMA 7 + SUPABASE ACTIVE
        </span>
      </div>

      {/* Confirmation Modal: Keluarkan Anggota */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[16px] bg-white p-6 shadow-2xl border border-border-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-house-green">Keluarkan Anggota?</h3>
                <p className="text-xs text-text-black-soft">Konfirmasi penghapusan anggota</p>
              </div>
            </div>

            <p className="text-xs text-text-black-soft leading-relaxed">
              Apakah Anda yakin ingin mengeluarkan <b>{memberToRemove.displayName}</b> dari rumah tangga ini?
              Setelah dikeluarkan, kuota anggota akan terbuka kembali (1/2) dan Anda dapat membuat tautan undangan baru.
            </p>

            {removeError && (
              <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                {removeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => {
                  setMemberToRemove(null);
                  setRemoveError(null);
                }}
                className="btn-pill px-4 py-2 text-xs font-semibold text-text-black-soft hover:bg-warm-sand/50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleConfirmRemove}
                className="btn-pill inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <UserMinus className="h-3.5 w-3.5" />
                <span>{isRemoving ? "Mengeluarkan..." : "Ya, Keluarkan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
