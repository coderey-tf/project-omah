"use client";

import { useState } from "react";
import { DocumentCategory } from "@prisma/client";
import { uploadDocumentAction } from "@/actions/vault-actions";
import {
  X,
  UploadCloud,
  FileText,
  Calendar,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: { label: string; value: DocumentCategory; icon: string; desc: string }[] = [
  { label: "Identitas", value: DocumentCategory.IDENTITY, icon: "🪪", desc: "KTP, KK, Akta Nikah, Paspor" },
  { label: "Kendaraan", value: DocumentCategory.VEHICLE, icon: "🚗", desc: "BPKB, STNK Kendaraan" },
  { label: "Properti", value: DocumentCategory.PROPERTY, icon: "🏠", desc: "Sertifikat Rumah, PBB, IMB" },
  { label: "Asuransi", value: DocumentCategory.INSURANCE, icon: "🛡️", desc: "Polis Jiwa, Kesehatan, Mobil" },
  { label: "Garansi", value: DocumentCategory.WARRANTY, icon: "📦", desc: "Nota & Kartu Garansi Aset" },
  { label: "Lainnya", value: DocumentCategory.OTHER, icon: "📁", desc: "Dokumen penting lainnya" },
];

export function UploadDocumentModal({ isOpen, onClose, onSuccess }: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>(DocumentCategory.IDENTITY);
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [createReminder, setCreateReminder] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        // Auto fill title from file name without extension
        const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf(".")) || selectedFile.name;
        setTitle(nameWithoutExt.replace(/[-_]/g, " "));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Pilih file dokumen terlebih dahulu");
      return;
    }
    if (!title.trim()) {
      setError("Judul dokumen wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("description", description.trim());
    if (expiryDate) {
      formData.append("expiryDate", expiryDate);
      formData.append("createReminder", createReminder ? "true" : "false");
    }

    const res = await uploadDocumentAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Gagal mengunggah dokumen");
    } else {
      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setExpiryDate("");
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
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text-black text-base">Unggah ke Brankas</h3>
              <p className="text-xs text-text-black-soft">Simpan salinan digital berkas penting</p>
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

          {/* File Picker Drag & Drop Zone */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Berkas Dokumen (PDF, Foto, Scan)
            </label>
            <label
              htmlFor="vault-file-upload"
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-colors ${
                file
                  ? "border-starbucks-green bg-green-light/20 text-starbucks-green"
                  : "border-border-card hover:border-starbucks-green bg-canvas/40"
              }`}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-starbucks-green" />
                  <div className="text-left overflow-hidden">
                    <p className="font-semibold text-text-black truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-text-black-soft">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || "file"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <UploadCloud className="h-8 w-8 mx-auto text-starbucks-green" />
                  <p className="font-medium text-text-black text-xs">
                    Klik untuk pilih berkas dokumen
                  </p>
                  <p className="text-[11px] text-text-black-soft">
                    Maks. 10 MB (PDF, JPG, PNG, WEBP)
                  </p>
                </div>
              )}
              <input
                id="vault-file-upload"
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Nama / Judul Dokumen *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: KTP Reynaldi, Akta Nikah, Polis Sinarmas"
              className="w-full px-4 py-2.5 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black placeholder:text-text-black-soft/60"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Kategori Dokumen
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    category === cat.value
                      ? "border-starbucks-green bg-green-light/40 text-starbucks-green shadow-xs"
                      : "border-border-card bg-canvas/20 text-text-black hover:bg-canvas/60"
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <div>
                    <p className="font-semibold text-xs leading-none">{cat.label}</p>
                    <p className="text-[10px] text-text-black-soft line-clamp-1 mt-0.5">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="p-3.5 bg-canvas/40 rounded-2xl border border-border-card space-y-2.5">
            <div className="flex items-center gap-2 text-text-black font-semibold text-xs">
              <Calendar className="h-4 w-4 text-starbucks-green" />
              <span>Masa Berlaku (Opsional)</span>
            </div>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-white focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
            />
            {expiryDate && (
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-text-black select-none">
                <input
                  type="checkbox"
                  checked={createReminder}
                  onChange={(e) => setCreateReminder(e.target.checked)}
                  className="rounded text-starbucks-green focus:ring-starbucks-green h-4 w-4"
                />
                <span>Buat pengingat H-30 & H-7 sebelum masa berlaku habis</span>
              </label>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Catatan / Nomor Berkas (Opsional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: No. Polis 1234567, disimpan di lemari kamar utama"
              className="w-full px-4 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black placeholder:text-text-black-soft/60 text-xs"
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
              disabled={loading || !file}
              className="btn-pill px-6 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold flex items-center gap-2 text-xs shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan ke Brankas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
