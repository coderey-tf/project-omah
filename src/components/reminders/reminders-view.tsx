"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Trash2,
  X,
  Loader2,
  Clock,
  Sparkles,
  AlertCircle,
  BellRing,
  Pencil,
  Repeat,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createReminderAction,
  updateReminderAction,
  markReminderDoneAction,
  unmarkReminderDoneAction,
  deleteReminderAction,
} from "@/actions/reminder-actions";
import type { EnrichedReminder } from "@/lib/data/reminders";

interface RemindersViewProps {
  initialReminders?: EnrichedReminder[];
}

export function RemindersView({ initialReminders }: RemindersViewProps) {
  const router = useRouter();
  const [reminders, setReminders] = useState<EnrichedReminder[]>(initialReminders || []);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "URGENT" | "UPCOMING" | "DONE">("ALL");

  useEffect(() => {
    if (initialReminders) {
      setReminders(initialReminders);
    }
  }, [initialReminders]);


  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<EnrichedReminder | null>(null);

  // Form states
  const [titleInput, setTitleInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [recurrenceInput, setRecurrenceInput] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("YEARLY");
  const [remindDaysInput, setRemindDaysInput] = useState<number[]>([30, 7, 0]);
  const [noteInput, setNoteInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeReminders = reminders.filter((r) => !r.isCompleted);
  const completedReminders = reminders.filter((r) => r.isCompleted);
  const urgentReminders = reminders.filter((r) => !r.isCompleted && (r.isOverdue || r.daysUntilDue <= 7));

  const filteredReminders = reminders.filter((r) => {
    if (activeFilter === "URGENT") return !r.isCompleted && (r.isOverdue || r.daysUntilDue <= 7);
    if (activeFilter === "UPCOMING") return !r.isCompleted && !r.isOverdue && r.daysUntilDue > 7;
    if (activeFilter === "DONE") return r.isCompleted;
    return true; // ALL
  });

  const handleOpenAdd = () => {
    setEditingReminder(null);
    setTitleInput("");
    setDueDateInput("");
    setRecurrenceInput("YEARLY");
    setRemindDaysInput([30, 7, 0]);
    setNoteInput("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reminder: EnrichedReminder) => {
    setEditingReminder(reminder);
    setTitleInput(reminder.title);
    setDueDateInput(reminder.dueDate.substring(0, 10));
    setRecurrenceInput(reminder.recurrence);
    setRemindDaysInput(reminder.remindDaysBefore);
    setNoteInput(reminder.note || "");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    if (!titleInput.trim()) {
      setErrorMsg("Judul pengingat wajib diisi");
      setIsSubmitting(false);
      return;
    }

    if (!dueDateInput) {
      setErrorMsg("Tanggal jatuh tempo wajib dipilih");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingReminder) {
        const res = await updateReminderAction({
          id: editingReminder.id,
          title: titleInput.trim(),
          dueDate: dueDateInput,
          recurrence: recurrenceInput,
          remindDaysBefore: remindDaysInput,
          note: noteInput.trim() || null,
        });

        if (!res.success) {
          setErrorMsg(res.error || "Gagal memperbarui pengingat");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createReminderAction({
          title: titleInput.trim(),
          dueDate: dueDateInput,
          recurrence: recurrenceInput,
          remindDaysBefore: remindDaysInput,
          note: noteInput.trim() || null,
        });

        if (!res.success) {
          setErrorMsg(res.error || "Gagal membuat pengingat");
          setIsSubmitting(false);
          return;
        }
      }

      setIsModalOpen(false);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDone = async (reminder: EnrichedReminder) => {
    setLoadingActionId(reminder.id);
    try {
      if (reminder.isCompleted) {
        await unmarkReminderDoneAction(reminder.id);
        setReminders((prev) =>
          prev.map((r) =>
            r.id === reminder.id ? { ...r, isCompleted: false, doneAt: null } : r
          )
        );
      } else {
        const res = await markReminderDoneAction(reminder.id);
        if (res.data?.advanced && res.data?.reminder?.dueDate) {
          const newDue = new Date(res.data.reminder.dueDate);
          setReminders((prev) =>
            prev.map((r) =>
              r.id === reminder.id
                ? {
                    ...r,
                    dueDate: newDue.toISOString(),
                    dueDateFormatted: newDue.toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }),
                    isCompleted: false,
                  }
                : r
            )
          );
        } else {
          setReminders((prev) =>
            prev.map((r) =>
              r.id === reminder.id
                ? { ...r, isCompleted: true, doneAt: new Date().toISOString() }
                : r
            )
          );
        }
      }
      router.refresh();
    } catch (err) {
      console.error("Gagal toggle status:", err);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (reminderId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengingat ini?")) return;
    setLoadingActionId(reminderId);
    try {
      await deleteReminderAction(reminderId);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      router.refresh();
    } catch (err) {
      console.error("Gagal menghapus pengingat:", err);
    } finally {
      setLoadingActionId(null);
    }
  };

  const toggleRemindDay = (day: number) => {
    setRemindDaysInput((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    );
  };

  const recurrenceLabels = {
    NONE: "Sekali Jalan",
    DAILY: "Harian",
    WEEKLY: "Mingguan",
    MONTHLY: "Bulanan",
    YEARLY: "Tahunan",
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="rounded-[16px] bg-house-green p-6 text-white shadow-starbucks-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-warm-cream border border-white/20">
              <FileText className="h-6 w-6 text-warm-gold" />
            </div>
            <div>
              <span className="font-caption-mono text-xs text-warm-cream/80 font-bold uppercase tracking-wider">
                ARSIP & TENGGAT DOKUMEN
              </span>
              <h1 className="font-serif text-2xl font-bold text-white">
                Pengingat Dokumen
              </h1>
              <p className="text-xs text-warm-cream/70 mt-0.5">
                STNK, Pajak PBB, Asuransi, Paspor, SIM, dan Dokumen Berkala
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-pill flex items-center justify-center gap-2 bg-starbucks-green hover:bg-starbucks-green/90 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer self-start sm:self-center"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pengingat</span>
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/15 text-center">
          <div className="bg-white/5 rounded-[12px] p-2.5">
            <span className="text-[11px] text-warm-cream/70 block">Aktif</span>
            <span className="text-lg font-bold font-mono text-white">
              {activeReminders.length}
            </span>
          </div>
          <div className="bg-white/5 rounded-[12px] p-2.5">
            <span className="text-[11px] text-warm-cream/70 block">Mendesak</span>
            <span className={`text-lg font-bold font-mono ${urgentReminders.length > 0 ? "text-danger" : "text-white"}`}>
              {urgentReminders.length}
            </span>
          </div>
          <div className="bg-white/5 rounded-[12px] p-2.5">
            <span className="text-[11px] text-warm-cream/70 block">Selesai</span>
            <span className="text-lg font-bold font-mono text-warm-gold">
              {completedReminders.length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: `Semua (${reminders.length})` },
          { id: "URGENT", label: `Mendesak (${urgentReminders.length})` },
          { id: "UPCOMING", label: "Mendatang" },
          { id: "DONE", label: `Selesai (${completedReminders.length})` },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id as any)}
            className={`btn-pill px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === f.id
                ? "bg-starbucks-green text-white shadow-sm"
                : "bg-white text-text-black-soft hover:text-text-black border border-border-card hover:bg-canvas"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3. Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="rounded-[12px] bg-white p-8 text-center border border-border-card shadow-starbucks-card">
          <FileText className="mx-auto h-10 w-10 text-text-black-soft/40 mb-2" />
          <h3 className="text-sm font-bold text-text-black">Tidak Ada Pengingat</h3>
          <p className="text-xs text-text-black-soft max-w-sm mx-auto mt-1 mb-4">
            {activeFilter === "URGENT"
              ? "Semua dokumen dalam kondisi aman! Tidak ada tenggat mendesak."
              : "Belum ada dokumen pada kategori ini. Tambahkan pengingat STNK, asuransi, atau pajak Anda."}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-pill inline-flex items-center gap-1.5 bg-starbucks-green text-white px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Pengingat Dokumen</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredReminders.map((rem) => {
            const isLoading = loadingActionId === rem.id;

            return (
              <div
                key={rem.id}
                className={`rounded-[12px] bg-white p-4.5 border transition-all shadow-starbucks-card space-y-3 ${
                  rem.isCompleted
                    ? "opacity-60 bg-canvas/60 border-border-card"
                    : rem.isOverdue
                    ? "border-l-4 border-l-danger border-y border-r border-border-card"
                    : rem.daysUntilDue <= 7
                    ? "border-l-4 border-l-warning border-y border-r border-border-card"
                    : "border-border-card hover:border-starbucks-green/50"
                }`}
              >
                {/* Top: Status Badges and Recurrence */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rem.isCompleted ? (
                      <span className="btn-pill text-[10px] px-2 py-0.5 bg-green-light text-starbucks-green font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Selesai</span>
                      </span>
                    ) : rem.isOverdue ? (
                      <span className="btn-pill text-[10px] px-2 py-0.5 bg-danger text-white font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Lewat {Math.abs(rem.daysUntilDue)} Hari</span>
                      </span>
                    ) : rem.daysUntilDue === 0 ? (
                      <span className="btn-pill text-[10px] px-2 py-0.5 bg-danger text-white font-bold animate-pulse">
                        Hari Ini Jatuh Tempo!
                      </span>
                    ) : rem.daysUntilDue <= 7 ? (
                      <span className="btn-pill text-[10px] px-2 py-0.5 bg-warning/20 text-yellow-800 font-bold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>H-{rem.daysUntilDue}</span>
                      </span>
                    ) : (
                      <span className="btn-pill text-[10px] px-2 py-0.5 bg-green-light text-starbucks-green font-bold">
                        H-{rem.daysUntilDue}
                      </span>
                    )}

                    {rem.recurrence !== "NONE" && (
                      <span className="btn-pill text-[10px] px-2 py-0.5 bg-canvas border border-border-card text-text-black-soft font-medium flex items-center gap-1">
                        <Repeat className="h-2.5 w-2.5" />
                        <span>{recurrenceLabels[rem.recurrence]}</span>
                      </span>
                    )}
                  </div>

                  {/* Actions Dropdown / Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(rem)}
                      className="p-1 rounded text-text-black-soft hover:text-house-green hover:bg-canvas transition-colors cursor-pointer"
                      title="Edit pengingat"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rem.id)}
                      className="p-1 rounded text-text-black-soft hover:text-danger hover:bg-canvas transition-colors cursor-pointer"
                      title="Hapus pengingat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Notes */}
                <div>
                  <h4 className={`text-sm font-bold text-text-black ${rem.isCompleted ? "line-through text-text-black-soft" : ""}`}>
                    {rem.title}
                  </h4>
                  {rem.note && (
                    <p className="text-xs text-text-black-soft mt-1 line-clamp-2">
                      {rem.note}
                    </p>
                  )}
                </div>

                {/* Due Date & Telegram Reminders */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border-card/60 text-xs text-text-black-soft">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-starbucks-green shrink-0" />
                    <span>Tenggat: <strong className="text-text-black">{rem.dueDateFormatted}</strong></span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    <BellRing className="h-3 w-3 text-warm-gold shrink-0" />
                    <span>Telegram: H-{rem.remindDaysBefore.join(", H-")}</span>
                  </div>
                </div>

                {/* Bottom Toggle Done Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleDone(rem)}
                    disabled={isLoading}
                    className={`btn-pill flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                      rem.isCompleted
                        ? "bg-canvas text-text-black-soft hover:text-text-black border border-border-card"
                        : "bg-starbucks-green hover:bg-house-green text-white shadow-sm"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : rem.isCompleted ? (
                      <RotateCcw className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {rem.isCompleted
                        ? "Batal Selesai"
                        : rem.recurrence !== "NONE"
                        ? "Selesai (Majukan Siklus)"
                        : "Tandai Selesai"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal Tambah / Edit Pengingat */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-[16px] bg-white p-6 shadow-2xl border border-border-card text-text-black">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-text-black-soft hover:text-text-black p-1.5 rounded-full hover:bg-canvas transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-light text-starbucks-green">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-house-green">
                  {editingReminder ? "Edit Pengingat Dokumen" : "Tambah Pengingat Dokumen"}
                </h3>
                <p className="text-xs text-text-black-soft">
                  Notifikasi otomatis H-30, H-7, dan Hari H ke Telegram
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-[10px] bg-danger/10 p-3 text-xs text-danger font-medium border border-danger/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-black mb-1">
                  Nama Dokumen / Kewajiban
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pajak Tahunan STNK Honda Vario, Paspor Suami"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full rounded-[10px] bg-canvas border border-border-card px-3.5 py-2 text-xs text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-black mb-1">
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    className="w-full rounded-[10px] bg-canvas border border-border-card px-3 py-2 text-xs text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-black mb-1">
                    Pengulangan
                  </label>
                  <select
                    value={recurrenceInput}
                    onChange={(e) => setRecurrenceInput(e.target.value as any)}
                    className="w-full rounded-[10px] bg-canvas border border-border-card px-3 py-2 text-xs text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green"
                  >
                    <option value="NONE">Sekali Saja (Tidak Berulang)</option>
                    <option value="YEARLY">Tahunan (Pajak STNK, Paspor, dll)</option>
                    <option value="MONTHLY">Bulanan</option>
                    <option value="WEEKLY">Mingguan</option>
                  </select>
                </div>
              </div>

              {/* Remind days selection */}
              <div>
                <span className="block text-xs font-semibold text-text-black mb-1.5">
                  Kirim Notifikasi Telegram Sebelum Tenggat:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[60, 30, 14, 7, 3, 0].map((day) => {
                    const isSelected = remindDaysInput.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleRemindDay(day)}
                        className={`btn-pill text-[11px] px-3 py-1 font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-starbucks-green text-white font-bold shadow-xs"
                            : "bg-canvas text-text-black-soft border border-border-card hover:bg-white"
                        }`}
                      >
                        {day === 0 ? "Hari H" : `H-${day}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-black mb-1">
                  Catatan / Lokasi Fisik Dokumen (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Disimpan di laci berkas lemari kerja, nomor rangka: ..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full rounded-[10px] bg-canvas border border-border-card px-3.5 py-2 text-xs text-text-black focus:outline-none focus:ring-1 focus:ring-starbucks-green resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{editingReminder ? "Perbarui Pengingat" : "Simpan Pengingat"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
