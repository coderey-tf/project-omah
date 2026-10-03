"use client";

import { useState } from "react";
import { AssetItem } from "@/lib/data/assets";
import { formatRupiah } from "@/lib/utils";
import {
  X,
  Car,
  Wrench,
  Calendar,
  Shield,
  Clock,
  Sparkles,
  Tv,
  Refrigerator,
  Package,
  Plus,
  Trash2,
  MapPin,
  FileText,
} from "lucide-react";

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetItem | null;
  onAddService: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
}

export function AssetDetailModal({
  isOpen,
  onClose,
  asset,
  onAddService,
  onDeleteAsset,
}: AssetDetailModalProps) {
  if (!isOpen || !asset) return null;

  const isVehicle = asset.type === "VEHICLE_CAR" || asset.type === "VEHICLE_MOTORCYCLE";

  const getIcon = () => {
    switch (asset.type) {
      case "VEHICLE_CAR":
      case "VEHICLE_MOTORCYCLE":
        return <Car className="h-6 w-6" />;
      case "ELECTRONIC":
        return <Tv className="h-6 w-6" />;
      case "HOME_APPLIANCE":
        return <Refrigerator className="h-6 w-6" />;
      case "JEWELRY_VALUABLE":
        return <Sparkles className="h-6 w-6" />;
      default:
        return <Package className="h-6 w-6" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-border-card overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card bg-canvas/60">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-house-green text-white flex items-center justify-center shadow-sm">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-bold text-text-black text-base leading-tight">{asset.name}</h3>
              <p className="text-xs text-text-black-soft mt-0.5">
                {asset.brandModel || "Detail & Riwayat Perawatan"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-text-black-soft hover:bg-canvas hover:text-text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Key Specs Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-canvas/40 p-4 rounded-2xl border border-border-card">
            <div>
              <span className="text-[10px] text-text-black-soft font-semibold uppercase block">
                Valuasi / Beli
              </span>
              <span className="text-xs font-bold text-house-green mt-0.5 block">
                {asset.purchasePrice ? formatRupiah(asset.purchasePrice) : "Tidak dicatat"}
              </span>
            </div>

            {isVehicle && (
              <div>
                <span className="text-[10px] text-text-black-soft font-semibold uppercase block">
                  Plat Nomor
                </span>
                <span className="text-xs font-bold text-text-black mt-0.5 block uppercase">
                  {asset.licensePlate || "-"}
                </span>
              </div>
            )}

            {isVehicle && (
              <div>
                <span className="text-[10px] text-text-black-soft font-semibold uppercase block">
                  Kilometer
                </span>
                <span className="text-xs font-bold text-text-black mt-0.5 block">
                  {asset.currentMileage ? `${new Intl.NumberFormat("id-ID").format(asset.currentMileage)} KM` : "-"}
                </span>
              </div>
            )}

            <div>
              <span className="text-[10px] text-text-black-soft font-semibold uppercase block">
                Tanggal Beli
              </span>
              <span className="text-xs font-medium text-text-black mt-0.5 block">
                {asset.purchaseDate || "-"}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-text-black-soft font-semibold uppercase block">
                No. Seri / IMEI
              </span>
              <span className="text-xs font-medium text-text-black mt-0.5 block truncate max-w-[120px]">
                {asset.serialNumber || "-"}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-text-black-soft font-semibold uppercase block">
                Masa Garansi
              </span>
              <span
                className={`text-xs font-bold mt-0.5 block ${
                  asset.isWarrantyExpired
                    ? "text-red-600"
                    : (asset.daysToWarrantyExpiry ?? 999) <= 30
                    ? "text-amber-600"
                    : "text-emerald-700"
                }`}
              >
                {asset.warrantyExpiry
                  ? asset.isWarrantyExpired
                    ? "Habis"
                    : `${asset.warrantyExpiry}`
                  : "-"}
              </span>
            </div>
          </div>

          {/* Note if any */}
          {asset.note && (
            <div className="p-3 bg-warm-sand/30 rounded-xl border border-border-card text-xs text-text-black-soft">
              <span className="font-semibold text-text-black">Catatan: </span>
              {asset.note}
            </div>
          )}

          {/* Maintenance / Service Timeline Header */}
          <div className="flex items-center justify-between pt-2 border-t border-border-card">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-starbucks-green" />
              <h4 className="font-bold text-text-black text-xs">
                Riwayat Servis ({asset.serviceLogsCount} Catatan)
              </h4>
            </div>

            <button
              onClick={() => {
                onClose();
                onAddService(asset.id);
              }}
              className="btn-pill px-3 py-1 bg-green-light/40 hover:bg-green-light text-starbucks-green font-semibold text-xs inline-flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Catat Servis</span>
            </button>
          </div>

          {/* Service Log Summary */}
          {asset.serviceLogsCount === 0 ? (
            <div className="text-center py-6 bg-canvas/30 rounded-2xl border border-dashed border-border-card">
              <Wrench className="h-6 w-6 mx-auto text-text-black-soft/60 mb-1" />
              <p className="text-xs font-semibold text-text-black">Belum Ada Riwayat Servis</p>
              <p className="text-[11px] text-text-black-soft">
                Catat pergantian oli, perawatan berkala, atau perbaikan untuk aset ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-white border border-border-card shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-black">Servis Terakhir</span>
                  <span className="text-text-black-soft text-[11px]">{asset.latestServiceDate}</span>
                </div>
                {asset.nextServiceDueDate && (
                  <p className="text-xs text-starbucks-green font-semibold">
                    📅 Jadwal servis berikutnya: {asset.nextServiceDueDate}
                  </p>
                )}
                {asset.nextServiceMileage && (
                  <p className="text-xs text-amber-700 font-semibold">
                    📍 Target KM berikutnya: {new Intl.NumberFormat("id-ID").format(asset.nextServiceMileage)} KM
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-card bg-canvas/30 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Yakin ingin menghapus ${asset.name}? Riwayat servis tidak akan hilang permanen namun aset disembunyikan.`)) {
                onDeleteAsset(asset.id);
                onClose();
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            <Trash2 className="h-4 w-4" />
            <span>Hapus Aset</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-border-card text-text-black font-semibold text-xs hover:bg-canvas transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
