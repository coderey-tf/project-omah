"use client";

import { useState } from "react";
import { KondanganType } from "@/types/enums";
import { createKondanganAction } from "@/actions/kondangan-actions";
import {
  X,
  Gift,
  HeartHandshake,
  Calendar,
  Wallet,
  Loader2,
  CheckCircle2,
  User,
} from "lucide-react";

interface AddKondanganModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wallets: Array<{ id: string; name: string; balance: number }>;
}

export function AddKondanganModal({
  isOpen,
  onClose,
  onSuccess,
  wallets,
}: AddKondanganModalProps) {
  const [type, setType] = useState<KondanganType>(KondanganType.GIVEN);
  const [personName, setPersonName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [giftItem, setGiftItem] = useState("");
  const [notes, setNotes] = useState("");
  const [createTransaction, setCreateTransaction] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setAmount("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(parseInt(val, 10));
    setAmount(`Rp ${formatted}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      setError("Nama kerabat wajib diisi");
      return;
    }
    if (!eventName.trim()) {
      setError("Nama acara wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("type", type);
    formData.append("personName", personName.trim());
    formData.append("eventName", eventName.trim());
    formData.append("eventDate", eventDate);
    formData.append("amount", amount);
    formData.append("giftItem", giftItem.trim());
    formData.append("notes", notes.trim());
    formData.append("createTransaction", createTransaction ? "true" : "false");
    formData.append("walletId", selectedWalletId);

    const res = await createKondanganAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Gagal menyimpan catatan kondangan");
    } else {
      setPersonName("");
      setEventName("");
      setAmount("");
      setGiftItem("");
      setNotes("");
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-border-card overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card bg-canvas/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-house-green text-white flex items-center justify-center shadow-sm">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text-black text-base">Catat Amplop / Kado</h3>
              <p className="text-xs text-text-black-soft">Rekam jejak sosial & timbal balik kondangan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-text-black-soft hover:bg-canvas hover:text-text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          {/* Type Toggle: GIVEN vs RECEIVED */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Jenis Catatan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType(KondanganType.GIVEN)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  type === KondanganType.GIVEN
                    ? "border-starbucks-green bg-green-light/40 text-starbucks-green shadow-xs"
                    : "border-border-card bg-canvas/20 text-text-black hover:bg-canvas/50"
                }`}
              >
                <div className="h-7 w-7 rounded-xl bg-white flex items-center justify-center text-starbucks-green border border-border-card shrink-0">
                  <Gift className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Kita Memberi (Kondangan)</p>
                  <p className="text-[10px] text-text-black-soft mt-0.5">Menghadiri hajatan orang lain</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType(KondanganType.RECEIVED)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  type === KondanganType.RECEIVED
                    ? "border-starbucks-green bg-green-light/40 text-starbucks-green shadow-xs"
                    : "border-border-card bg-canvas/20 text-text-black hover:bg-canvas/50"
                }`}
              >
                <div className="h-7 w-7 rounded-xl bg-white flex items-center justify-center text-starbucks-green border border-border-card shrink-0">
                  <HeartHandshake className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Kita Menerima (Hajatan)</p>
                  <p className="text-[10px] text-text-black-soft mt-0.5">Diterima di acara keluarga kita</p>
                </div>
              </button>
            </div>
          </div>

          {/* Person Name & Event Name */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                {type === KondanganType.GIVEN ? "Yang Punya Hajat / Kerabat *" : "Nama Pemberi Amplop / Kerabat *"}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, Pak RT Joko, Tante Mira"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Nama Acara / Hajatan *
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Contoh: Pernikahan Budi & Ani, Syukuran Rumah Baru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Tanggal Acara *
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
            />
          </div>

          {/* Amount & Gift Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Nominal Amplop Uang
              </label>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Rp 0"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-white focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Barang Kado (Jika Non-Uang)
              </label>
              <input
                type="text"
                value={giftItem}
                onChange={(e) => setGiftItem(e.target.value)}
                placeholder="cth: Blender Philips, Sprei"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
          </div>

          {/* Auto-Transaction Checkbox if GIVEN */}
          {type === KondanganType.GIVEN && amount && (
            <div className="p-3 bg-canvas/40 rounded-2xl border border-border-card space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-black select-none">
                <input
                  type="checkbox"
                  checked={createTransaction}
                  onChange={(e) => setCreateTransaction(e.target.checked)}
                  className="rounded text-starbucks-green focus:ring-starbucks-green h-4 w-4"
                />
                <span>Catat nominal ini ke Pengeluaran Kas (Kategori Kondangan)</span>
              </label>

              {createTransaction && (
                <div className="pt-1">
                  <label className="block text-[11px] font-medium text-text-black-soft mb-1">
                    Pilih Dompet Sumber Dana
                  </label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border-card bg-white text-xs text-text-black font-medium"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Saldo: Rp {new Intl.NumberFormat("id-ID").format(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Catatan / Hubungan Kerabat
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="cth: Teman kantor Suami, Sepupu Mama"
              className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-full border border-border-card text-text-black font-medium hover:bg-canvas transition-colors text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-pill px-6 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold flex items-center gap-2 text-xs shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Catatan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
