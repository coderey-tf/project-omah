"use client";

import { useState } from "react";
import { AssetType } from "@/types/enums";
import type { AssetItem } from "@/lib/data/assets";
import { formatRupiah } from "@/lib/utils";
import { AddAssetModal } from "./add-asset-modal";
import { AddServiceModal } from "./add-service-modal";
import { AssetDetailModal } from "./asset-detail-modal";
import { deleteAssetAction } from "@/actions/asset-actions";
import {
  Car,
  Tv,
  Refrigerator,
  Sparkles,
  Package,
  Plus,
  Wrench,
  Search,
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
} from "lucide-react";

interface AssetsViewProps {
  initialAssets: AssetItem[];
  totalValuation: number;
  warrantyExpiringSoonCount: number;
  wallets: Array<{ id: string; name: string; balance: number }>;
}

const TYPE_TABS: { label: string; value: string; icon: string }[] = [
  { label: "Semua", value: "ALL", icon: "📦" },
  { label: "Kendaraan", value: "VEHICLES", icon: "🚗" },
  { label: "Elektronik", value: AssetType.ELECTRONIC, icon: "💻" },
  { label: "Perabot", value: AssetType.HOME_APPLIANCE, icon: "🧊" },
  { label: "Berharga", value: AssetType.JEWELRY_VALUABLE, icon: "💍" },
  { label: "Lainnya", value: AssetType.OTHER, icon: "📁" },
];

export function AssetsView({
  initialAssets,
  totalValuation,
  warrantyExpiringSoonCount,
  wallets,
}: AssetsViewProps) {
  const [assets, setAssets] = useState<AssetItem[]>(initialAssets);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [serviceTargetAssetId, setServiceTargetAssetId] = useState<string | undefined>(undefined);
  const [selectedDetailAsset, setSelectedDetailAsset] = useState<AssetItem | null>(null);

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    let matchesType = true;
    if (selectedType === "VEHICLES") {
      matchesType = asset.type === AssetType.VEHICLE_CAR || asset.type === AssetType.VEHICLE_MOTORCYCLE;
    } else if (selectedType !== "ALL") {
      matchesType = asset.type === selectedType;
    }

    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.brandModel && asset.brandModel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.licensePlate && asset.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  const vehicleCount = assets.filter(
    (a) => a.type === AssetType.VEHICLE_CAR || a.type === AssetType.VEHICLE_MOTORCYCLE
  ).length;

  const handleDeleteAsset = async (assetId: string) => {
    const res = await deleteAssetAction(assetId);
    if (res.success) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } else {
      alert(res.error || "Gagal menghapus aset");
    }
  };

  const getAssetBadge = (type: AssetType) => {
    switch (type) {
      case AssetType.VEHICLE_CAR:
      case AssetType.VEHICLE_MOTORCYCLE:
        return { label: type === AssetType.VEHICLE_CAR ? "Mobil" : "Motor", bg: "bg-blue-50 text-blue-800 border-blue-200", icon: Car };
      case AssetType.ELECTRONIC:
        return { label: "Elektronik", bg: "bg-purple-50 text-purple-800 border-purple-200", icon: Tv };
      case AssetType.HOME_APPLIANCE:
        return { label: "Perabot", bg: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: Refrigerator };
      case AssetType.JEWELRY_VALUABLE:
        return { label: "Berharga", bg: "bg-amber-50 text-amber-800 border-amber-200", icon: Sparkles };
      default:
        return { label: "Lainnya", bg: "bg-gray-100 text-gray-700 border-gray-200", icon: Package };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border-card shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-house-green text-white flex items-center justify-center shadow-md">
            <Car className="h-7 w-7" />
          </div>
          <div>
            <span className="font-caption-mono text-xs text-starbucks-green font-bold tracking-wider uppercase">
              Fase 2 • Inventaris & Perawatan
            </span>
            <h1 className="text-2xl font-bold text-text-black tracking-tight">
              Aset & Servis Kendaraan
            </h1>
            <p className="text-xs text-text-black-soft mt-0.5">
              Kelola barang berharga, kartu garansi, riwayat servis bengkel, dan jadwal ganti oli.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setServiceTargetAssetId(assets[0]?.id);
              setIsAddServiceOpen(true);
            }}
            className="btn-pill px-4 py-2.5 bg-warm-sand hover:bg-warm-sand/80 text-house-green font-semibold flex items-center gap-1.5 text-xs border border-border-card transition-all"
          >
            <Wrench className="h-4 w-4 text-starbucks-green" />
            <span>Catat Servis</span>
          </button>

          <button
            onClick={() => setIsAddAssetOpen(true)}
            className="btn-pill px-5 py-2.5 bg-house-green hover:bg-starbucks-green text-white font-semibold flex items-center gap-2 text-xs shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Daftar Aset Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Estimasi Valuasi Aset</p>
            <p className="text-xl font-bold text-house-green mt-0.5">{formatRupiah(totalValuation)}</p>
            <span className="text-[10px] text-text-black-soft">Dari {assets.length} unit barang terdaftar</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-green-light/40 flex items-center justify-center text-starbucks-green">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Armada Kendaraan</p>
            <p className="text-xl font-bold text-text-black mt-0.5">{vehicleCount} Unit</p>
            <span className="text-[10px] text-text-black-soft">Mobil & Sepeda Motor</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <Car className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border-card shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-text-black-soft font-medium">Status Garansi</p>
            <p className="text-xl font-bold text-amber-700 mt-0.5">{warrantyExpiringSoonCount} Perlu Dicek</p>
            <span className="text-[10px] text-text-black-soft">Habis atau segera habis</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-black-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aset, merek, plat nomor kendaraan..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-card rounded-2xl text-xs text-text-black placeholder:text-text-black-soft/60 focus:outline-none focus:ring-2 focus:ring-starbucks-green shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {TYPE_TABS.map((tab) => {
            const isSelected = selectedType === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedType(tab.value)}
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

      {/* 4. Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-border-card shadow-xs space-y-3">
          <div className="h-16 w-16 bg-canvas rounded-full flex items-center justify-center mx-auto text-starbucks-green">
            <Package className="h-8 w-8 text-text-black-soft" />
          </div>
          <h3 className="font-bold text-text-black text-base">Belum Ada Aset Terdaftar</h3>
          <p className="text-xs text-text-black-soft max-w-sm mx-auto">
            Daftarkan sepeda motor, mobil, kulkas, AC, atau laptop untuk mencatat riwayat servis dan masa berlaku garansi.
          </p>
          <button
            onClick={() => setIsAddAssetOpen(true)}
            className="btn-pill px-5 py-2 bg-house-green hover:bg-starbucks-green text-white font-semibold text-xs inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="h-4 w-4" />
            <span>Daftar Aset Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssets.map((asset) => {
            const badge = getAssetBadge(asset.type);
            const Icon = badge.icon;
            const isVehicle = asset.type === AssetType.VEHICLE_CAR || asset.type === AssetType.VEHICLE_MOTORCYCLE;

            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl p-5 border border-border-card hover:border-starbucks-green/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{badge.label}</span>
                    </span>

                    {/* Warranty Badge */}
                    {asset.warrantyExpiry && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          asset.isWarrantyExpired
                            ? "bg-red-50 text-red-700 border-red-200"
                            : (asset.daysToWarrantyExpiry ?? 999) <= 30
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {asset.isWarrantyExpired
                          ? "Garansi Habis"
                          : (asset.daysToWarrantyExpiry ?? 999) <= 30
                          ? `Garansi sisa ${asset.daysToWarrantyExpiry} hr`
                          : `Garansi s/d ${asset.warrantyExpiry}`}
                      </span>
                    )}
                  </div>

                  {/* Title & Brand */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-text-black text-base group-hover:text-starbucks-green transition-colors">
                        {asset.name}
                      </h3>
                      {asset.brandModel && (
                        <p className="text-xs text-text-black-soft mt-0.5">{asset.brandModel}</p>
                      )}
                    </div>

                    {asset.licensePlate && (
                      <span className="font-caption-mono text-xs font-bold px-2 py-1 rounded-lg bg-canvas text-house-green border border-border-card">
                        {asset.licensePlate}
                      </span>
                    )}
                  </div>

                  {/* Specs Snippet */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border-card/60 text-xs">
                    <div>
                      <span className="text-[10px] text-text-black-soft uppercase block">Valuasi Beli</span>
                      <span className="font-bold text-house-green mt-0.5 block">
                        {asset.purchasePrice ? formatRupiah(asset.purchasePrice) : "Tidak dicatat"}
                      </span>
                    </div>

                    {isVehicle && (
                      <div>
                        <span className="text-[10px] text-text-black-soft uppercase block">Odometer Terkini</span>
                        <span className="font-bold text-text-black mt-0.5 block">
                          {asset.currentMileage
                            ? `${new Intl.NumberFormat("id-ID").format(asset.currentMileage)} KM`
                            : "-"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Maintenance Snippet */}
                  {asset.latestServiceDate ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-canvas/50 border border-border-card text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-3.5 w-3.5 text-starbucks-green" />
                        <span className="text-text-black-soft">Servis: {asset.latestServiceDate}</span>
                      </div>
                      {asset.nextServiceDueDate && (
                        <span className="text-[11px] font-semibold text-starbucks-green">
                          Next: {asset.nextServiceDueDate}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-2 rounded-xl bg-canvas/30 text-[11px] text-text-black-soft flex items-center gap-1.5">
                      <Info className="h-3 w-3 text-text-black-soft/60" />
                      <span>Belum ada log perawatan</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-card/60">
                  <button
                    onClick={() => {
                      setServiceTargetAssetId(asset.id);
                      setIsAddServiceOpen(true);
                    }}
                    className="btn-pill px-3 py-1.5 bg-green-light/40 hover:bg-green-light text-starbucks-green font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Catat Servis</span>
                  </button>

                  <button
                    onClick={() => setSelectedDetailAsset(asset)}
                    className="btn-pill px-3.5 py-1.5 bg-white hover:bg-canvas border border-border-card text-text-black font-semibold text-xs transition-colors"
                  >
                    <span>Detail & Riwayat ({asset.serviceLogsCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onSuccess={() => window.location.reload()}
        assets={assets.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          licensePlate: a.licensePlate,
          currentMileage: a.currentMileage,
        }))}
        wallets={wallets}
        defaultAssetId={serviceTargetAssetId}
      />

      <AssetDetailModal
        isOpen={!!selectedDetailAsset}
        onClose={() => setSelectedDetailAsset(null)}
        asset={selectedDetailAsset}
        onAddService={(assetId) => {
          setServiceTargetAssetId(assetId);
          setIsAddServiceOpen(true);
        }}
        onDeleteAsset={handleDeleteAsset}
      />
    </div>
  );
}
