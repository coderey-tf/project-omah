"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Send,
  MessageSquare,
  Check,
  Copy,
  ExternalLink,
  Trash2,
  RefreshCw,
  Phone,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import {
  generateTelegramLinkCodeAction,
  linkWhatsAppChannelAction,
  toggleNotificationChannelAction,
  unlinkNotificationChannelAction,
  sendTestNotificationAction,
} from "@/actions/notification-actions";

export interface ChannelItem {
  id: string;
  channel: "TELEGRAM" | "WHATSAPP";
  address: string | null;
  isActive: boolean;
  linkCodeHash?: string | null;
  linkCodeExpiresAt?: string | null;
  linkedAt?: string | null;
}

export interface ProfileWithChannels {
  id: string;
  displayName: string;
  role: string;
  joinedAt: string;
  channels: ChannelItem[];
}

interface NotificationChannelsCardProps {
  profiles: ProfileWithChannels[];
}

export function NotificationChannelsCard({ profiles }: NotificationChannelsCardProps) {
  const router = useRouter();

  // Telegram Link Modal State
  const [telegramModalProfile, setTelegramModalProfile] = useState<ProfileWithChannels | null>(null);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null);
  const [telegramBotUsername, setTelegramBotUsername] = useState<string>("OmahBot");
  const [isGeneratingTg, setIsGeneratingTg] = useState(false);
  const [copiedTgCode, setCopiedTgCode] = useState(false);

  // WhatsApp Link Modal State
  const [waModalProfile, setWaModalProfile] = useState<ProfileWithChannels | null>(null);
  const [waPhoneNumber, setWaPhoneNumber] = useState("");
  const [isLinkingWa, setIsLinkingWa] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [waSuccess, setWaSuccess] = useState<string | null>(null);

  // Testing & Action State
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const handleOpenTelegramModal = async (profile: ProfileWithChannels) => {
    setTelegramModalProfile(profile);
    setIsGeneratingTg(true);
    setTelegramCode(null);
    setTelegramDeepLink(null);

    try {
      const res = await generateTelegramLinkCodeAction(profile.id);
      if (res.success && res.code) {
        setTelegramCode(res.code);
        setTelegramDeepLink(res.deepLink || null);
        if (res.botUsername) setTelegramBotUsername(res.botUsername);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTg(false);
    }
  };

  const handleCopyTgCode = () => {
    if (!telegramCode) return;
    navigator.clipboard.writeText(telegramCode);
    setCopiedTgCode(true);
    setTimeout(() => setCopiedTgCode(false), 2000);
  };

  const handleLinkWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waModalProfile || !waPhoneNumber.trim() || isLinkingWa) return;

    setIsLinkingWa(true);
    setWaError(null);
    setWaSuccess(null);

    try {
      const res = await linkWhatsAppChannelAction(waModalProfile.id, waPhoneNumber);
      if (res.success) {
        setWaSuccess(`Nomor ${res.phone} berhasil dihubungkan!`);
        setTimeout(() => {
          setWaModalProfile(null);
          setWaPhoneNumber("");
          setWaSuccess(null);
          router.refresh();
        }, 1500);
      } else {
        setWaError(res.error || "Gagal menghubungkan WhatsApp");
      }
    } catch (err: any) {
      setWaError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLinkingWa(false);
    }
  };

  const handleToggle = async (channelId: string, currentStatus: boolean) => {
    try {
      await toggleNotificationChannelAction(channelId, !currentStatus);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlink = async (channelId: string) => {
    if (!confirm("Apakah Anda yakin ingin memutuskan saluran notifikasi ini?")) return;
    try {
      await unlinkNotificationChannelAction(channelId);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTest = async (channelId: string) => {
    setTestingChannelId(channelId);
    setActionMessage(null);
    try {
      const res = await sendTestNotificationAction(channelId);
      if (res.success) {
        setActionMessage({ id: channelId, text: "Notifikasi tes terkirim!", ok: true });
      } else {
        setActionMessage({ id: channelId, text: res.error || "Gagal mengirim pesan", ok: false });
      }
    } catch (err: any) {
      setActionMessage({ id: channelId, text: err.message || "Gagal tes koneksi", ok: false });
    } finally {
      setTestingChannelId(null);
      setTimeout(() => {
        setActionMessage((prev) => (prev?.id === channelId ? null : prev));
      }, 4000);
    }
  };

  return (
    <div className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-card gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-starbucks-green">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-house-green">
              Kanal Notifikasi Otomatis
            </h3>
            <p className="text-xs text-text-black-soft">
              Pengingat harian jatuh tempo tagihan & dokumen via Telegram Bot dan WhatsApp
            </p>
          </div>
        </div>
        <span className="font-caption-mono text-[10px] px-2.5 py-1 rounded-full bg-warm-sand text-house-green font-bold self-start sm:self-auto">
          CRON 08:00 WIB
        </span>
      </div>

      {/* Profiles Notification List */}
      <div className="space-y-4">
        {profiles.map((profile) => {
          const telegramChannel = profile.channels?.find((c) => c.channel === "TELEGRAM" && c.address);
          const whatsappChannel = profile.channels?.find((c) => c.channel === "WHATSAPP" && c.address);

          return (
            <div
              key={profile.id}
              className="p-4 rounded-[10px] bg-canvas border border-border-card space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-house-green text-white font-bold text-xs">
                    {profile.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-house-green">{profile.displayName}</span>
                    <span className="text-[10px] font-caption-mono text-text-black-soft ml-1.5 px-1.5 py-0.5 rounded-sm bg-white border border-border-card">
                      {profile.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Channels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Telegram Channel Card */}
                <div className="p-3 rounded-[8px] bg-white border border-border-card flex flex-col justify-between space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                        <Send className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-black">Telegram Bot</p>
                        <p className="text-[10px] text-text-black-soft">Notifikasi resmi terenkripsi</p>
                      </div>
                    </div>

                    {telegramChannel ? (
                      <span
                        className={`text-[10px] font-caption-mono px-2 py-0.5 rounded-full font-bold ${
                          telegramChannel.isActive
                            ? "bg-green-light text-starbucks-green"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {telegramChannel.isActive ? "AKTIF" : "NONAKTIF"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-caption-mono px-2 py-0.5 rounded-full bg-canvas text-text-black-soft font-semibold border border-border-card">
                        BELUM TAUT
                      </span>
                    )}
                  </div>

                  {telegramChannel ? (
                    <div className="space-y-2 pt-1 border-t border-border-card">
                      <div className="flex items-center justify-between text-[11px] text-text-black-soft">
                        <span>Chat ID: <b className="font-mono text-text-black">{telegramChannel.address}</b></span>
                        <button
                          type="button"
                          onClick={() => handleToggle(telegramChannel.id, telegramChannel.isActive)}
                          className="hover:text-house-green cursor-pointer"
                          title={telegramChannel.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {telegramChannel.isActive ? (
                            <ToggleRight className="h-5 w-5 text-starbucks-green" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {actionMessage?.id === telegramChannel.id && (
                        <p
                          className={`text-[10px] font-medium leading-tight ${
                            actionMessage.ok ? "text-starbucks-green" : "text-red-500"
                          }`}
                        >
                          {actionMessage.text}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          disabled={testingChannelId === telegramChannel.id}
                          onClick={() => handleTest(telegramChannel.id)}
                          className="btn-pill flex-1 py-1.5 bg-canvas hover:bg-warm-sand border border-border-card text-[11px] font-semibold text-house-green transition-all cursor-pointer text-center"
                        >
                          {testingChannelId === telegramChannel.id ? "Mengirim..." : "Uji Coba"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnlink(telegramChannel.id)}
                          className="p-1.5 rounded-[6px] hover:bg-red-50 text-text-black-soft hover:text-red-600 transition-colors cursor-pointer"
                          title="Putuskan saluran"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTelegramModal(profile)}
                        className="btn-pill w-full py-1.5 bg-starbucks-green hover:bg-house-green text-white text-[11px] font-semibold shadow-2xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <Send className="h-3 w-3" />
                        <span>Tautkan Telegram</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. WhatsApp Channel Card */}
                <div className="p-3 rounded-[8px] bg-white border border-border-card flex flex-col justify-between space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-black">WhatsApp (WAHA)</p>
                        <p className="text-[10px] text-text-black-soft">Notifikasi via chat WhatsApp</p>
                      </div>
                    </div>

                    {whatsappChannel ? (
                      <span
                        className={`text-[10px] font-caption-mono px-2 py-0.5 rounded-full font-bold ${
                          whatsappChannel.isActive
                            ? "bg-green-light text-starbucks-green"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {whatsappChannel.isActive ? "AKTIF" : "NONAKTIF"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-caption-mono px-2 py-0.5 rounded-full bg-canvas text-text-black-soft font-semibold border border-border-card">
                        BELUM TAUT
                      </span>
                    )}
                  </div>

                  {whatsappChannel ? (
                    <div className="space-y-2 pt-1 border-t border-border-card">
                      <div className="flex items-center justify-between text-[11px] text-text-black-soft">
                        <span>Nomor: <b className="font-mono text-text-black">+{whatsappChannel.address}</b></span>
                        <button
                          type="button"
                          onClick={() => handleToggle(whatsappChannel.id, whatsappChannel.isActive)}
                          className="hover:text-house-green cursor-pointer"
                          title={whatsappChannel.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {whatsappChannel.isActive ? (
                            <ToggleRight className="h-5 w-5 text-starbucks-green" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {actionMessage?.id === whatsappChannel.id && (
                        <p
                          className={`text-[10px] font-medium leading-tight ${
                            actionMessage.ok ? "text-starbucks-green" : "text-red-500"
                          }`}
                        >
                          {actionMessage.text}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          disabled={testingChannelId === whatsappChannel.id}
                          onClick={() => handleTest(whatsappChannel.id)}
                          className="btn-pill flex-1 py-1.5 bg-canvas hover:bg-warm-sand border border-border-card text-[11px] font-semibold text-house-green transition-all cursor-pointer text-center"
                        >
                          {testingChannelId === whatsappChannel.id ? "Mengirim..." : "Uji Coba"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnlink(whatsappChannel.id)}
                          className="p-1.5 rounded-[6px] hover:bg-red-50 text-text-black-soft hover:text-red-600 transition-colors cursor-pointer"
                          title="Putuskan saluran"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setWaModalProfile(profile);
                          setWaPhoneNumber("");
                          setWaError(null);
                          setWaSuccess(null);
                        }}
                        className="btn-pill w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shadow-2xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Tautkan WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Tips */}
      <div className="p-3.5 rounded-[8px] bg-canvas-soft border border-border-card flex items-start gap-2.5 text-xs text-text-black-soft leading-relaxed">
        <Info className="h-4 w-4 text-starbucks-green shrink-0 mt-0.5" />
        <p>
          Notifikasi harian otomatis berjalan setiap pagi pukul <b>08:00 WIB</b> untuk mengingatkan tagihan H-3 & H-0 serta dokumen jatuh tempo. Anda juga dapat mengirim perintah cepat seperti <b>/saldo</b>, <b>/tagihan</b>, atau <b>/tugas</b> kapan saja ke bot Telegram maupun WhatsApp!
        </p>
      </div>

      {/* Telegram Link Modal */}
      {telegramModalProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-2xl border border-border-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-house-green">
                  Tautkan Bot Telegram
                </h3>
                <p className="text-xs text-text-black-soft">
                  Untuk profil <b>{telegramModalProfile.displayName}</b>
                </p>
              </div>
            </div>

            {isGeneratingTg ? (
              <div className="py-8 text-center text-xs text-text-black-soft space-y-2">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-starbucks-green" />
                <p>Membuat kode penautan sekali pakai...</p>
              </div>
            ) : telegramCode ? (
              <div className="space-y-4">
                <div className="p-4 rounded-[10px] bg-canvas border border-border-card text-center space-y-2">
                  <span className="text-[10px] font-caption-mono text-starbucks-green font-bold uppercase tracking-wider">
                    KODE VERIFIKASI (BERLAKU 15 MENIT)
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-bold tracking-widest text-house-green bg-white px-4 py-1.5 rounded-lg border border-border-card">
                      {telegramCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTgCode}
                      className="p-2 rounded-lg bg-white border border-border-card hover:bg-warm-sand transition-colors cursor-pointer text-text-black-soft hover:text-house-green"
                      title="Salin kode"
                    >
                      {copiedTgCode ? <Check className="h-4 w-4 text-starbucks-green" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-text-black-soft space-y-2">
                  <p className="font-semibold text-text-black">Langkah Penautan:</p>
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                    <li>Buka bot Telegram Omah di <b>@{telegramBotUsername}</b>.</li>
                    <li>
                      Ketik pesan berikut di chat bot:
                      <code className="block mt-1 font-mono text-[11px] bg-canvas px-2.5 py-1 rounded border border-border-card text-house-green font-bold">
                        /start {telegramCode}
                      </code>
                    </li>
                    <li>Bot akan langsung mengonfirmasi dan akun Anda aktif!</li>
                  </ol>
                </div>

                {telegramDeepLink && (
                  <a
                    href={telegramDeepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-pill w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Buka Langsung di Telegram</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setTelegramModalProfile(null);
                  router.refresh();
                }}
                className="btn-pill px-4 py-2 text-xs font-semibold text-text-black-soft hover:bg-warm-sand/50 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Link Modal */}
      {waModalProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-2xl border border-border-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-house-green">
                  Tautkan Nomor WhatsApp
                </h3>
                <p className="text-xs text-text-black-soft">
                  Untuk profil <b>{waModalProfile.displayName}</b>
                </p>
              </div>
            </div>

            <form onSubmit={handleLinkWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
                  NOMOR WHATSAPP AKTIF
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    value={waPhoneNumber}
                    onChange={(e) => setWaPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-[8px] border border-border-input bg-canvas text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent font-mono"
                  />
                </div>
                <p className="text-[11px] text-text-black-soft mt-1.5 leading-relaxed">
                  Pesan selamat datang dan pengingat tagihan akan dikirimkan otomatis ke nomor ini melalui WAHA WhatsApp gateway.
                </p>
              </div>

              {waError && (
                <div className="p-3 rounded-[8px] bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{waError}</span>
                </div>
              )}

              {waSuccess && (
                <div className="p-3 rounded-[8px] bg-green-50 border border-green-200 text-xs text-starbucks-green font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{waSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isLinkingWa}
                  onClick={() => {
                    setWaModalProfile(null);
                    setWaPhoneNumber("");
                    setWaError(null);
                  }}
                  className="btn-pill px-4 py-2 text-xs font-semibold text-text-black-soft hover:bg-warm-sand/50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!waPhoneNumber.trim() || isLinkingWa}
                  className="btn-pill inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <span>{isLinkingWa ? "Menghubungkan..." : "Hubungkan WhatsApp"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
