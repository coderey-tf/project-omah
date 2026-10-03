"use client";

import { useState } from "react";
import { addServiceLogAction } from "@/actions/asset-actions";
import {
  X,
  Wrench,
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle2,
  Car,
  Wallet,
} from "lucide-react";

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assets: Array<{ id: string; name: string; type: string; licensePlate?: string | null; currentMileage?: number | null }>;
  wallets: Array<{ id: string; name: string; balance: number }>;
  defaultAssetId?: string;
}

export function AddServiceModal({
  isOpen,
  onClose,
  onSuccess,
  assets,
  wallets,
  defaultAssetId,
}: AddServiceModalProps) {
  const [selectedAssetId, setSelectedAssetId] = useState(defaultAssetId || assets[0]?.id || "");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [mileage, setMileage] = useState("");
  const [serviceCenter, setServiceCenter] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [createTransaction, setCreateTransaction] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || "");
  const [nextDueDate, setNextDueDate] = useState("");
  const [nextMileage, setNextMileage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAsset = assets.find((a) => a.id === selectedAssetId);
  const isVehicle = currentAsset?.type === "VEHICLE_CAR" || currentAsset?.type === "VEHICLE_MOTORCYCLE";

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setCost("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(parseInt(val, 10));
    setCost(`Rp ${formatted}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      setError("Pilih aset yang diservis");
      return;
    }
    if (!description.trim()) {
      setError("Tindakan servis wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("assetId", selectedAssetId);
    formData.append("serviceDate", serviceDate);
    formData.append("mileage", mileage);
    formData.append("serviceCenter", serviceCenter.trim());
    formData.append("description", description.trim());
    formData.append("cost", cost);
    formData.append("createTransaction", createTransaction ? "true" : "false");
    formData.append("walletId", selectedWalletId);
    formData.append("nextDueDate", nextDueDate);
    formData.append("nextMileage", nextMileage);

    const res = await addServiceLogAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Gagal mencatat servis");
    } else {
      setDescription("");
      setCost("");
      setMileage("");
      setServiceCenter("");
      setNextDueDate("");
      setNextMileage("");
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
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-text-black text-base">Catat Servis / Perawatan</h3>
              <p className="text-xs text-text-black-soft">Rekam perbaikan, ganti oli, dan biaya perawatan</p>
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

          {/* Select Asset */}
          <div>
            <label className="block text-xs font-semibold text-text-black mb-1.5">
              Pilih Aset / Kendaraan *
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs font-medium"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.licensePlate ? `(${a.licensePlate})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Service Date & KM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Tanggal Servis *
              </label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>

            {isVehicle && (
              <div>
                <label className="block text-xs font-semibold text-text-black mb-1.5">
                  Kilometer Saat Ini (KM)
                </label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder={currentAsset?.currentMileage ? `cth: ${currentAsset.currentMileage + 2000}` : "cth: 15000"}
                  className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
                />
              </div>
            )}
          </div>

          {/* Service Center & Actions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Nama Bengkel / Toko Servis
              </label>
              <input
                type="text"
                value={serviceCenter}
                onChange={(e) => setServiceCenter(e.target.value)}
                placeholder="cth: AHASS Honda Cipete, Bengkel AC Makmur"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Rincian Tindakan Servis *
              </label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="cth: Ganti oli mesin MPX2, ganti busi, kuras radiator, cuci filter"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-canvas/30 focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs"
              />
            </div>
          </div>

          {/* Cost & Auto-Transaction Section */}
          <div className="p-3.5 bg-canvas/40 rounded-2xl border border-border-card space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text-black mb-1.5">
                Total Biaya Servis
              </label>
              <input
                type="text"
                value={cost}
                onChange={handleCostChange}
                placeholder="Rp 0"
                className="w-full px-3.5 py-2 rounded-xl border border-border-card bg-white focus:outline-none focus:ring-2 focus:ring-starbucks-green text-text-black text-xs font-semibold"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-text-black select-none">
              <input
                type="checkbox"
                checked={createTransaction}
                onChange={(e) => setCreateTransaction(e.target.checked)}
                className="rounded text-starbucks-green focus:ring-starbucks-green h-4 w-4"
              />
              <span>Catat biaya ini otomatis ke Pengeluaran Kas (Kategori Servis)</span>
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

          {/* Next Due Date & KM */}
          <div className="p-3.5 bg-green-light/20 rounded-2xl border border-green-light/60 space-y-2">
            <div className="flex items-center gap-2 text-starbucks-green font-semibold text-xs">
              <Calendar className="h-4 w-4" />
              <span>Prediksi Servis Berikutnya (Opsional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[11px] text-text-black-soft block mb-1">Tanggal Rencana</span>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-border-card bg-white text-xs text-text-black"
                />
              </div>
              {isVehicle && (
                <div>
                  <span className="text-[11px] text-text-black-soft block mb-1">Target KM Berikutnya</span>
                  <input
                    type="number"
                    value={nextMileage}
                    onChange={(e) => setNextMileage(e.target.value)}
                    placeholder="cth: 20000"
                    className="w-full px-3 py-1.5 rounded-xl border border-border-card bg-white text-xs text-text-black"
                  />
                </div>
              )}
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
                  <span>Simpan Catatan Servis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
