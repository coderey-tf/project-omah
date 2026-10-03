import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { createTransactionAction } from "@/actions/transaction-actions";

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  wallets?: Array<{ id: string; name: string }>;
  categories?: Array<{ id: string; name: string; kind?: string }>;
}

const DEFAULT_CATEGORIES = [
  { id: "c1", name: "Bahan Makanan" },
  { id: "c2", name: "Makan Luar" },
  { id: "c3", name: "Transportasi" },
  { id: "c4", name: "Utilitas" },
  { id: "c5", name: "Belanja Rumah" },
  { id: "c6", name: "Kesehatan" },
  { id: "c7", name: "Hiburan" },
  { id: "c8", name: "Lainnya" },
];

const DEFAULT_WALLETS = [
  { id: "w1", name: "Kas Tunai" },
  { id: "w2", name: "BCA Bersama" },
  { id: "w3", name: "GoPay / OVO" },
];

export function QuickTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  wallets = DEFAULT_WALLETS,
  categories = DEFAULT_CATEGORIES,
}: QuickTransactionModalProps) {
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [amountStr, setAmountStr] = useState<string>("");
  const [category, setCategory] = useState<string>(categories[0]?.name || "Bahan Makanan");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || "");
  const [wallet, setWallet] = useState<string>(wallets[0]?.id || "w1");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategory(categories[0].name);
      setCategoryId(categories[0].id);
    }
    if (wallets && wallets.length > 0) {
      setWallet(wallets[0].id);
    }
  }, [categories, wallets]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, "");
    setAmountStr(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountStr || Number(amountStr) <= 0) return;

    setIsSubmitting(true);
    try {
      const activeWalletId = wallet || wallets[0]?.id;
      const activeCategoryId = categoryId || categories[0]?.id;

      await createTransactionAction({
        type,
        amount: Number(amountStr),
        walletId: activeWalletId,
        categoryId: type !== "TRANSFER" ? activeCategoryId : null,
        description,
        occurredOn: new Date(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setAmountStr("");
      setDescription("");
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  const parsedAmount = amountStr ? Number(amountStr) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-[12px] bg-white p-6 shadow-2xl border border-border-card">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border-card">
          <div>
            <span className="font-caption-mono text-[11px] text-starbucks-green font-bold">
              INPUT CEPAT (&lt;10 DETIK)
            </span>
            <h3 className="text-lg text-text-black font-bold">Catat Transaksi</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-text-black-soft hover:text-text-black hover:bg-canvas transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          {/* Type Toggle Pills */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-full bg-canvas border border-border-card">
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`btn-pill py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                type === "EXPENSE"
                  ? "bg-white text-danger shadow-sm border border-border-card"
                  : "text-text-black-soft hover:text-text-black"
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`btn-pill py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                type === "INCOME"
                  ? "bg-white text-starbucks-green shadow-sm border border-border-card"
                  : "text-text-black-soft hover:text-text-black"
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType("TRANSFER")}
              className={`btn-pill py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                type === "TRANSFER"
                  ? "bg-white text-text-black shadow-sm border border-border-card"
                  : "text-text-black-soft hover:text-text-black"
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Amount Display Input */}
          <div className="rounded-[12px] bg-canvas p-4 text-center border border-border-card focus-within:border-green-accent focus-within:bg-white transition-colors">
            <label className="block text-xs font-semibold text-text-black-soft mb-1">
              JUMLAH NOMINAL (RP)
            </label>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xl font-semibold text-text-black-soft">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="0"
                value={parsedAmount > 0 ? parsedAmount.toLocaleString("id-ID") : ""}
                onChange={handleAmountChange}
                className="w-full text-center text-3xl sm:text-4xl font-bold text-text-black bg-transparent focus:outline-none tracking-tight"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
              KETERANGAN
            </label>
            <input
              type="text"
              placeholder="Contoh: Belanja bahan dapur di supermarket"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-[8px] border border-border-input bg-white px-3.5 py-2.5 text-sm text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
              KATEGORI
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.name);
                    setCategoryId(cat.id);
                  }}
                  className={`btn-pill px-3 py-1 text-xs border transition-colors cursor-pointer font-medium ${
                    categoryId === cat.id
                      ? "border-green-accent bg-green-light text-starbucks-green font-semibold"
                      : "border-border-card bg-canvas text-text-black-soft hover:border-text-black-soft"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Choice */}
          <div>
            <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
              SUMBER DOMPET
            </label>
            <div className="grid grid-cols-3 gap-2">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWallet(w.id)}
                  className={`py-2 px-2 text-xs rounded-[8px] border text-center transition-colors cursor-pointer truncate font-medium ${
                    wallet === w.id
                      ? "border-green-accent bg-green-light/40 text-starbucks-green font-semibold"
                      : "border-border-card bg-canvas text-text-black-soft hover:border-text-black-soft"
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-border-card">
            <button
              type="button"
              onClick={onClose}
              className="btn-pill border border-border-input bg-white hover:bg-canvas px-4 py-2 text-xs font-semibold text-text-black transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || parsedAmount <= 0}
              className="btn-pill flex items-center gap-1.5 bg-green-accent hover:bg-starbucks-green text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
