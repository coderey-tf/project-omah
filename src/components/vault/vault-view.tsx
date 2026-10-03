"use client";

import { useState } from "react";
import { DocumentCategory } from "@prisma/client";
import { VaultDocumentItem } from "@/lib/data/vault";
import { UploadDocumentModal } from "./upload-document-modal";
import { deleteDocumentAction } from "@/actions/vault-actions";
import {
  Shield,
  FileText,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
} from "lucide-react";

interface VaultViewProps {
  initialDocuments: VaultDocumentItem[];
}

const CATEGORY_TABS: { label: string; value: string; icon: string }[] = [
  { label: "Semua", value: "ALL", icon: "📁" },
  { label: "Identitas", value: DocumentCategory.IDENTITY, icon: "🪪" },
  { label: "Kendaraan", value: DocumentCategory.VEHICLE, icon: "🚗" },
  { label: "Properti", value: DocumentCategory.PROPERTY, icon: "🏠" },
  { label: "Asuransi", value: DocumentCategory.INSURANCE, icon: "🛡️" },
  { label: "Garansi", value: DocumentCategory.WARRANTY, icon: "📦" },
  { label: "Lainnya", value: DocumentCategory.OTHER, icon: "📄" },
];

export function VaultView({ initialDocuments }: VaultViewProps) {
  const [documents, setDocuments] = useState<VaultDocumentItem[]>(initialDocuments);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === "ALL" || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Calculate summary metrics
  const totalDocs = documents.length;
  const expiringSoonCount = documents.filter(
    (d) => d.daysToExpiry !== null && d.daysToExpiry !== undefined && d.daysToExpiry <= 30
  ).length;
  const identityCount = documents.filter(
    (d) => d.category === DocumentCategory.IDENTITY || d.category === DocumentCategory.PROPERTY
  ).length;

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus salinan dokumen ini dari brankas?")) {
      return;
    }
    setDeletingId(id);
    const res = await deleteDocumentAction(id);
    setDeletingId(null);
    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert(res.error || "Gagal menghapus dokumen");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getCategoryBadge = (category: DocumentCategory) => {
    switch (category) {
      case DocumentCategory.IDENTITY:
        return { label: "Identitas", bg: "bg-blue-50 text-blue-800 border-blue-200", icon: "🪪" };
      case DocumentCategory.VEHICLE:
        return { label: "Kendaraan", bg: "bg-amber-50 text-amber-800 border-amber-200", icon: "🚗" };
      case DocumentCategory.PROPERTY:
        return { label: "Properti", bg: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: "🏠" };
      case DocumentCategory.INSURANCE:
        return { label: "Asuransi", bg: "bg-purple-50 text-purple-800 border-purple-200", icon: "🛡️" };
      case DocumentCategory.WARRANTY:
        return { label: "Garansi", bg: "bg-orange-50 text-orange-800 border-orange-200", icon: "📦" };
      default:
        return { label: "Lainnya", bg: "bg-gray-100 text-gray-700 border-gray-200", icon: "📁" };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-house-green text-white flex items-center justify-center shadow-md">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <span className="font-caption-mono text-xs text-starbucks-green font-bold tracking-wider uppercase">
              Fase 2 • Ruang Simpan Privat
            </span>
            <h1 className="text-2xl font-bold text-text-black tracking-tight">
              Brankas Dokumen Keluarga
            </h1>
            <p className="text-xs text-text-black-soft mt-0.5">
              Penyimpanan salinan digital terenkripsi untuk KTP, KK, BPKB, STNK, dan polis asuransi.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="btn-pill px-5 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold flex items-center justify-center gap-2 text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Unggah Dokumen</span>
        </button>
      </div>

      {/* 2. Stat Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Total Dokumen</p>
            <p className="text-xl font-bold text-text-black mt-0.5">{totalDocs} Berkas</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-canvas flex items-center justify-center text-starbucks-green">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Identitas & Properti</p>
            <p className="text-xl font-bold text-text-black mt-0.5">{identityCount} Berkas</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <Shield className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Perlu Perhatian</p>
            <p className="text-xl font-bold text-amber-700 mt-0.5">{expiringSoonCount} Kadaluarsa / Segera</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dokumen, nama berkas, nomor polis..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-card rounded-2xl text-xs text-text-black placeholder:text-text-black-soft/60 focus:outline-none focus:ring-2 focus:ring-starbucks-green shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedCategory(tab.value)}
                className={`btn-pill px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-starbucks-green text-white shadow-xs"
                    : "bg-white text-text-black-soft border border-border-card hover:border-starbucks-green hover:text-text-black"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-border-card shadow-xs space-y-3">
          <div className="h-16 w-16 bg-canvas rounded-full flex items-center justify-center mx-auto text-starbucks-green">
            <FileText className="h-8 w-8 text-text-black-soft" />
          </div>
          <h3 className="font-bold text-text-black text-base">Belum Ada Dokumen di Kategori Ini</h3>
          <p className="text-xs text-text-black-soft max-w-sm mx-auto">
            Mulai simpan salinan kartu identitas, akta nikah, asuransi, atau dokumen kendaraan agar mudah diakses kapan saja.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn-pill px-5 py-2 bg-house-green hover:bg-starbucks-green text-white font-semibold text-xs inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="h-4 w-4" />
            <span>Unggah Dokumen Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => {
            const badge = getCategoryBadge(doc.category);
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-5 border border-border-card hover:border-starbucks-green/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
                    >
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>

                    {/* Expiry Badge */}
                    {doc.expiryDate && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          doc.isExpired
                            ? "bg-red-50 text-red-700 border-red-200"
                            : (doc.daysToExpiry ?? 999) <= 30
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {doc.isExpired
                          ? "Sudah Kadaluarsa"
                          : (doc.daysToExpiry ?? 999) <= 30
                          ? `Jatuh tempo dlm ${doc.daysToExpiry} hari`
                          : `Berlaku s/d ${doc.expiryDate}`}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-text-black text-sm group-hover:text-starbucks-green transition-colors line-clamp-1">
                    {doc.title}
                  </h3>
                  {doc.description && (
                    <p className="text-xs text-text-black-soft mt-1 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  {/* Meta Details */}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-text-black-soft">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>Diunggah {doc.creatorName}</span>
                    <span>•</span>
                    <span>{doc.createdAt.split("T")[0]}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-card/60">
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 text-text-black-soft hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Hapus Dokumen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {doc.downloadUrl ? (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-pill px-3.5 py-1.5 bg-green-light/40 hover:bg-green-light text-starbucks-green font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Buka / Unduh</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-text-black-soft italic">
                        Tersimpan di Vault
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          // Re-fetch or reload
          window.location.reload();
        }}
      />
    </div>
  );
}
