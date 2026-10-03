"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { markBillPaidAction } from "@/actions/bill-actions";
import { CheckCircle2, X, AlertCircle, Loader2, Wallet } from "lucide-react";

interface BillItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category?: string;
}

interface WalletItem {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface PayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: BillItem | null;
  wallets: WalletItem[];
  onSuccess: () => void;
}

export function PayBillModal({
  isOpen,
  onClose,
  bill,
  wallets,
  onSuccess,
}: PayBillModalProps) {
  const [createTransaction, setCreateTransaction] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState(
    wallets[0]?.id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await markBillPaidAction({
        billId: bill.id,
        createTransaction,
        walletId: createTransaction ? selectedWalletId || undefined : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menandai tagihan");
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-[16px] bg-white p-6 shadow-2xl border border-border-card text-text-black">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-black-soft hover:text-text-black p-1.5 rounded-full hover:bg-canvas transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Title & Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-light text-starbucks-green">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-house-green">
              Tandai Tagihan Lunas
            </h3>
            <p className="text-xs text-text-black-soft">
              Konfirmasi pembayaran tagihan siklus ini
            </p>
          </div>
        </div>

        {/* Bill Overview Card */}
        <div className="rounded-[12px] bg-canvas p-4 border border-border-card mb-4 space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-text-black-soft uppercase tracking-wider">
                Nama Tagihan
              </p>
              <h4 className="text-base font-bold text-text-black">{bill.name}</h4>
            </div>
            <span className="text-xs text-text-black-soft bg-white px-2 py-0.5 rounded border border-border-card">
              {bill.category || "Utilitas"}
            </span>
          </div>
          <div className="pt-2 flex justify-between items-baseline border-t border-border-card/60 mt-2">
            <span className="text-xs text-text-black-soft">Batas Tempo: {bill.dueDate}</span>
            <span className="font-mono text-lg font-bold text-house-green">
              {formatRupiah(bill.amount)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-[10px] bg-danger/10 p-3 text-xs text-danger font-medium border border-danger/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Create Transaction Checkbox */}
          <div className="rounded-[12px] bg-canvas p-3.5 border border-border-card space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createTransaction}
                onChange={(e) => setCreateTransaction(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border-card text-starbucks-green focus:ring-starbucks-green cursor-pointer accent-starbucks-green"
              />
              <div className="text-xs">
                <span className="font-bold text-text-black block">
                  Catat transaksi pengeluaran otomatis
                </span>
                <span className="text-text-black-soft text-[11px] block mt-0.5">
                  Saldo dompet yang dipilih akan otomatis berkurang sesuai nominal tagihan.
                </span>
              </div>
            </label>

            {createTransaction && (
              <div className="pt-2 border-t border-border-card/60">
                <label className="block text-xs font-semibold text-text-black mb-1.5 flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-starbucks-green" />
                  <span>Pilih Dompet Sumber Dana</span>
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full rounded-[10px] bg-white border border-border-card px-3 py-2 text-xs text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                  required={createTransaction}
                >
                  {wallets.length === 0 ? (
                    <option value="">Tidak ada dompet tersedia</option>
                  ) : (
                    wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} · ({formatRupiah(w.balance)})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-pill px-4 py-2 text-xs font-semibold text-text-black-soft hover:bg-canvas transition-colors border border-border-card cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-pill flex items-center gap-2 bg-starbucks-green hover:bg-house-green text-white px-5 py-2 text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Konfirmasi Lunas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
