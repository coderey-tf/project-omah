"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { createTransactionAction } from "@/actions/transaction-actions";

export interface InitialReceiptData {
  type?: "EXPENSE" | "INCOME" | "TRANSFER";
  amount?: number;
  occurredOn?: string;
  description?: string;
  matchedWalletId?: string;
  matchedCategoryId?: string;
  merchantOrParty?: string;
}

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  wallets?: Array<{ id: string; name: string }>;
  categories?: Array<{ id: string; name: string; kind?: string }>;
  initialReceiptData?: InitialReceiptData | null;
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

const SCAN_STEPS_MESSAGES = [
  "Mengompres & membaca bukti pembayaran...",
  "Menganalisis teks & nominal myBCA dengan Gemini AI...",
  "Mencocokkan rekening sumber & kategori belanja...",
];

/**
 * Kompresi gambar sisi klien sebelum upload.
 * Menurunkan ukuran foto 5-10MB (kamera HP) menjadi ~200-300KB dalam ~50ms,
 * memangkas waktu tunggu upload dari 4-6 detik menjadi 0.2 detik!
 */
async function compressImageForOcr(file: File): Promise<Blob | File> {
  if (!file.type.startsWith("image/") || file.size < 350 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDimension = 1400; // Resolusi sangat cukup untuk ketajaman teks struk
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          "image/jpeg",
          0.85
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    } catch {
      resolve(file);
    }
  });
}

export function QuickTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  wallets = DEFAULT_WALLETS,
  categories = DEFAULT_CATEGORIES,
  initialReceiptData,
}: QuickTransactionModalProps) {
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [amountStr, setAmountStr] = useState<string>("");
  const [category, setCategory] = useState<string>(categories[0]?.name || "Bahan Makanan");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || "");
  const [wallet, setWallet] = useState<string>(wallets[0]?.id || "w1");
  const [description, setDescription] = useState<string>("");
  const [occurredOnStr, setOccurredOnStr] = useState<string>(new Date().toISOString().split("T")[0]);

  // Loading & Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanBadge, setScanBadge] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync kategori & dompet default
  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      setCategory(categories[0].name);
      setCategoryId(categories[0].id);
    }
    if (wallets && wallets.length > 0 && !wallet) {
      setWallet(wallets[0].id);
    }
  }, [categories, wallets, categoryId, wallet]);

  // Rotasi pesan status AI saat proses scanning berlangsung
  useEffect(() => {
    if (!isScanning) return;
    setScanStepIndex(0);
    const interval = setInterval(() => {
      setScanStepIndex((prev) => (prev + 1) % SCAN_STEPS_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isScanning]);

  // Sync initialReceiptData (dari PWA Web Share Target atau pemanggilan luar)
  useEffect(() => {
    if (!initialReceiptData) return;

    if (initialReceiptData.type) setType(initialReceiptData.type);
    if (initialReceiptData.amount && initialReceiptData.amount > 0) {
      setAmountStr(String(initialReceiptData.amount));
    }
    if (initialReceiptData.description) {
      setDescription(initialReceiptData.description);
    }
    if (initialReceiptData.occurredOn) {
      setOccurredOnStr(initialReceiptData.occurredOn);
    }
    if (initialReceiptData.matchedWalletId) {
      setWallet(initialReceiptData.matchedWalletId);
    }
    if (initialReceiptData.matchedCategoryId) {
      setCategoryId(initialReceiptData.matchedCategoryId);
      const matched = categories.find((c) => c.id === initialReceiptData.matchedCategoryId);
      if (matched) setCategory(matched.name);
    }

    setScanBadge(
      initialReceiptData.merchantOrParty
        ? `Terisi otomatis: ${initialReceiptData.merchantOrParty}`
        : "Terisi otomatis dari bukti transfer"
    );
  }, [initialReceiptData, categories]);

  // Listener untuk Paste (Ctrl+V screenshot langsung dari clipboard)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, wallets, categories]);

  if (!isOpen) return null;

  const handleProcessFile = async (rawFile: File) => {
    setIsScanning(true);
    setScanError(null);
    setScanBadge(null);
    setFormError(null);

    try {
      // 1. Kompresi gambar sisi klien terlebih dahulu
      const processedBlob = await compressImageForOcr(rawFile);
      const fileToUpload =
        processedBlob instanceof File
          ? processedBlob
          : new File([processedBlob], rawFile.name || "receipt.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const res = await fetch("/api/receipt/scan", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memproses gambar bukti bayar");
      }

      const data = json.data;
      if (data.type) setType(data.type);
      if (data.amount) setAmountStr(String(data.amount));
      if (data.description) setDescription(data.description);
      if (data.occurredOn) setOccurredOnStr(data.occurredOn);

      if (data.matchedWalletId) {
        setWallet(data.matchedWalletId);
      } else {
        const bca = wallets.find((w) => /bca/i.test(w.name));
        if (bca) setWallet(bca.id);
      }

      if (data.matchedCategoryId) {
        setCategoryId(data.matchedCategoryId);
        const catObj = categories.find((c) => c.id === data.matchedCategoryId);
        if (catObj) setCategory(catObj.name);
      }

      setScanBadge(
        data.merchantOrParty
          ? `Terisi otomatis: ${data.merchantOrParty}`
          : "✨ Berhasil diisi otomatis oleh AI"
      );
    } catch (err: any) {
      console.error("[Scanner Error]", err);
      setScanError(err.message || "Gagal membaca struk");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, "");
    setAmountStr(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountStr || Number(amountStr) <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const activeWalletId = wallet || wallets[0]?.id;
      const activeCategoryId = categoryId || categories[0]?.id;

      const res = await createTransactionAction({
        type,
        amount: Number(amountStr),
        walletId: activeWalletId,
        categoryId: type !== "TRANSFER" ? activeCategoryId : null,
        description,
        occurredOn: occurredOnStr ? new Date(occurredOnStr) : new Date(),
      });

      if (!res?.success) {
        setFormError(res?.error || "Gagal menyimpan transaksi");
        setIsSubmitting(false);
        return;
      }

      // Animasi status sukses sejenak
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitSuccess(false);
        setAmountStr("");
        setDescription("");
        setScanBadge(null);
        setScanError(null);
        setFormError(null);
        onClose();
        if (onSuccess) onSuccess();
      }, 350);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Terjadi kesalahan saat menyimpan transaksi");
      setIsSubmitting(false);
    }
  };

  const parsedAmount = amountStr ? Number(amountStr) : 0;
  const isFormLocked = isSubmitting || submitSuccess || isScanning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-[12px] bg-white p-6 shadow-2xl border border-border-card"
        onDragOver={(e) => {
          e.preventDefault();
          if (!isFormLocked) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (isFormLocked) return;
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith("image/")) {
            handleProcessFile(file);
          }
        }}
      >
        {/* Top Loading Progress Bar */}
        {(isSubmitting || isScanning) && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-light overflow-hidden rounded-t-[12px] z-20">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-green-accent to-emerald-600 animate-indeterminate w-1/2" />
          </div>
        )}

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
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-full p-1.5 text-text-black-soft hover:text-text-black hover:bg-canvas transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* AI Quick Scan Box */}
        <div className="pt-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            disabled={isFormLocked}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleProcessFile(file);
              e.target.value = ""; // Reset input agar bisa pilih file yang sama jika diinginkan
            }}
          />

          {isScanning ? (
            /* HUD Scanning State yang Menawan */
            <div className="relative overflow-hidden w-full p-4 rounded-[10px] bg-emerald-50/90 border border-emerald-300 shadow-inner text-emerald-900 transition-all">
              {/* Animasi Sinar Scanline */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scanline" />

              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <span>Sedang Menganalisis Bukti Bayar</span>
                    <span className="inline-block animate-pulse">✨</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                    {SCAN_STEPS_MESSAGES[scanStepIndex]}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Tombol Default Scan Bukti Bayar */
            <button
              type="button"
              disabled={isFormLocked}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[10px] border border-dashed transition-all cursor-pointer text-xs font-medium ${
                isDragging
                  ? "border-green-accent bg-green-light text-starbucks-green scale-[1.01]"
                  : "border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-800 hover:border-emerald-400 active:scale-[0.99]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <b>Scan / Upload Bukti Bayar</b> (myBCA, QRIS, Struk)
              </span>
              <span className="text-[10px] text-emerald-600/70 hidden sm:inline">
                • atau Ctrl+V
              </span>
            </button>
          )}

          {/* Success Badge */}
          {scanBadge && !isScanning && (
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in duration-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="truncate font-medium">{scanBadge}</span>
            </div>
          )}

          {/* Error Notification Scan */}
          {scanError && !isScanning && (
            <div className="mt-2 flex items-start gap-1.5 px-3 py-2 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-xs animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Bukti Pembayaran Belum Terbaca</p>
                <p className="text-[11px] text-red-700 leading-relaxed">{scanError}</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="pt-3 space-y-4">
          {/* Form Error Alert */}
          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-xs animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Gagal Menyimpan</p>
                <p className="text-[11px] text-red-700 leading-relaxed">{formError}</p>
              </div>
            </div>
          )}

          {/* Type Toggle Pills */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-full bg-canvas border border-border-card">
            <button
              type="button"
              disabled={isFormLocked}
              onClick={() => setType("EXPENSE")}
              className={`btn-pill py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
                type === "EXPENSE"
                  ? "bg-white text-danger shadow-sm border border-border-card"
                  : "text-text-black-soft hover:text-text-black"
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              disabled={isFormLocked}
              onClick={() => setType("INCOME")}
              className={`btn-pill py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
                type === "INCOME"
                  ? "bg-white text-starbucks-green shadow-sm border border-border-card"
                  : "text-text-black-soft hover:text-text-black"
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              disabled={isFormLocked}
              onClick={() => setType("TRANSFER")}
              className={`btn-pill py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
                type === "TRANSFER"
                  ? "bg-white text-text-black shadow-sm border border-border-card"
                  : "text-text-black-soft hover:text-text-black"
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Amount Display Input */}
          <div
            className={`rounded-[12px] bg-canvas p-4 text-center border border-border-card focus-within:border-green-accent focus-within:bg-white transition-colors ${
              isScanning ? "animate-pulse" : ""
            }`}
          >
            <label className="block text-xs font-semibold text-text-black-soft mb-1">
              JUMLAH NOMINAL (RP)
            </label>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xl font-semibold text-text-black-soft">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                disabled={isFormLocked}
                placeholder="0"
                value={parsedAmount > 0 ? parsedAmount.toLocaleString("id-ID") : ""}
                onChange={handleAmountChange}
                className="w-full text-center text-3xl sm:text-4xl font-bold text-text-black bg-transparent focus:outline-none tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={isFormLocked}
              placeholder="Contoh: Belanja baju di Uniqlo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-[8px] border border-border-input bg-white px-3.5 py-2.5 text-sm text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
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
                  disabled={isFormLocked}
                  onClick={() => {
                    setCategory(cat.name);
                    setCategoryId(cat.id);
                  }}
                  className={`btn-pill px-3 py-1 text-xs border transition-colors cursor-pointer font-medium disabled:cursor-not-allowed ${
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
                  disabled={isFormLocked}
                  onClick={() => setWallet(w.id)}
                  className={`py-2 px-2 text-xs rounded-[8px] border text-center transition-colors cursor-pointer truncate font-medium disabled:cursor-not-allowed ${
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

          {/* Action Buttons with High-Feedback Loading State */}
          <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-border-card">
            <button
              type="button"
              disabled={isSubmitting || submitSuccess}
              onClick={onClose}
              className="btn-pill border border-border-input bg-white hover:bg-canvas px-4 py-2 text-xs font-semibold text-text-black transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Batal
            </button>

            {submitSuccess ? (
              <button
                type="button"
                disabled
                className="btn-pill flex items-center gap-1.5 bg-emerald-600 text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Berhasil Tersimpan!</span>
              </button>
            ) : isSubmitting ? (
              <button
                type="button"
                disabled
                className="btn-pill flex items-center gap-2 bg-green-accent text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all cursor-wait opacity-90"
              >
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Menyimpan Transaksi...</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isScanning || parsedAmount <= 0}
                className="btn-pill flex items-center gap-1.5 bg-green-accent hover:bg-starbucks-green text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>Simpan Transaksi</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
