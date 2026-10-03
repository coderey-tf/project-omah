"use client";

import { useState } from "react";
import { AssetType } from "@prisma/client";
import { createAssetAction } from "@/actions/asset-actions";
import {
  X,
  Plus,
  Shield,
  Car,
  Tv,
  Refrigerator,
  Sparkles,
  Package,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ASSET_TYPES: { label: string; value: AssetType; icon: any; desc: string }[] = [
  { label: "Mobil", value: AssetType.VEHICLE_CAR, icon: Car, desc: "Mobil pribadi / keluarga" },
  { label: "Motor", value: AssetType.VEHICLE_MOTORCYCLE, icon: Car, desc: "Sepeda motor" },
  { label: "Elektronik", value: AssetType.ELECTRONIC, icon: Tv, desc: "Laptop, HP, TV, gadget" },
  { label: "Perabot", value: AssetType.HOME_APPLIANCE, icon: Refrigerator, desc: "Kulkas, AC, mesin cuci" },
  { label: "Berharga", value: AssetType.JEWELRY_VALUABLE, icon: Sparkles, desc: "Emas, jam tangan, dll" },
  { label: "Lainnya", value: AssetType.OTHER, icon: Package, desc: "Aset rumah tangga lain" },
];

export function AddAssetModal({ isOpen, onClose, onSuccess }: AddAssetModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>(AssetType.VEHICLE_MOTORCYCLE);
  const [brandModel, setBrandModel] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [createWarrantyReminder, setCreateWarrantyReminder] = useState(true);
  const [licensePlate, setLicensePlate] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isVehicle = type === AssetType.VEHICLE_CAR || type === AssetType.VEHICLE_MOTORCYCLE;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setPurchasePrice("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(parseInt(val, 10));
    setPurchasePrice(`Rp ${formatted}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama aset wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("type", type);
    formData.append("brandModel", brandModel.trim());
    formData.append("purchasePrice", purchasePrice);
    formData.append("purchaseDate", purchaseDate);
    formData.append("warrantyExpiry", warrantyExpiry);
    formData.append("createWarrantyReminder", createWarrantyReminder ? "true" : "false");
    formData.append("licensePlate", licensePlate.trim().toUpperCase());
    formData.append("currentMileage", currentMileage);
    formData.append("serialNumber", serialNumber.trim());
    formData.append("note", note.trim());

    const res = await createAssetAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Gagal menyimpan aset");
    } else {
      // Reset form
      setName("");
      setBrandModel("");
      setPurchasePrice("");
      setPurchaseDate("");
      setWarrantyExpiry("");
      setLicensePlate("");
      setCurrentMileage("");
      setSerialNumber("");
      setNote("");
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
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text-black text-base">Daftarkan Aset Baru</h3>
              <p className="text-xs text-text-black-soft">Catat barang berharga, garansi, atau kendaraan</p>
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

          {/* Asset Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Tipe / Kategori Aset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ASSET_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      type === t.value
                        ? "border-starbucks-green bg-green-light/40 text-starbucks-green shadow-xs font-bold"
                        : "border-border-card bg-canvas/30 text-text-black hover:bg-canvas/60 font-medium"
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Nama Aset *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Vario 160, Kulkas LG"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Merek & Model
              </label>
              <input
                type="text"
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                placeholder="cth: Honda Vario CBS 2024"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
          </div>

          {/* Vehicle Specific Fields */}
          {isVehicle && (
            <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/60 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Plat Nomor
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="B 1234 ABC"
                  className="w-full px-3 py-1.5 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Kilometer Terkini (KM)
                </label>
                <input
                  type="number"
                  value={currentMileage}
                  onChange={(e) => setCurrentMileage(e.target.value)}
                  placeholder="cth: 12500"
                  className="w-full px-3 py-1.5 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
                />
              </div>
            </div>
          )}

          {/* Price & Purchase Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Harga Beli / Valuasi
              </label>
              <input
                type="text"
                value={purchasePrice}
                onChange={handlePriceChange}
                placeholder="Rp 0"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Tanggal Pembelian
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
          </div>

          {/* Warranty Section */}
          <div className="p-3.5 bg-canvas/40 rounded-2xl border border-border-card space-y-2">
            <div className="flex items-center gap-2 text-text-black font-semibold text-xs">
              <Shield className="h-4 w-4 text-starbucks-green" />
              <span>Masa Garansi Toko / Pabrik</span>
            </div>
            <input
              type="date"
              value={warrantyExpiry}
              onChange={(e) => setWarrantyExpiry(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-border-card bg-white focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
            />
            {warrantyExpiry && (
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-text-black select-none">
                <input
                  type="checkbox"
                  checked={createWarrantyReminder}
                  onChange={(e) => setCreateWarrantyReminder(e.target.checked)}
                  className="rounded text-starbucks-green focus:ring-starbucks-green h-4 w-4"
                />
                <span>Buat pengingat H-30 sebelum garansi habis</span>
              </label>
            )}
          </div>

          {/* Serial Number & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Nomor Seri / IMEI
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="cth: SN-829140283"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Catatan Tambahan
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="cth: Disimpan di ruang kerja"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
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
                  <span>Daftarkan Aset</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
