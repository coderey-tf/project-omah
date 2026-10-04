"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Trash2,
  Check,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  Repeat,
  Sparkles,
} from "lucide-react";
import {
  toggleTaskAction,
  addTaskAction,
  deleteTaskAction,
} from "@/actions/task-actions";
import { Recurrence } from "@/types/enums";
import { useRealtime } from "@/hooks/use-realtime";

interface TaskItem {
  id: string;
  title: string;
  assigneeId: string | null;
  assigneeName: string;
  dueDate: string | null;
  dueDateFormatted: string;
  recurrence: Recurrence;
  isCompleted: boolean;
  isUrgent: boolean;
  isOverdue: boolean;
  doneAt: string | null;
}

interface ProfileItem {
  id: string;
  displayName: string;
  role: string;
}

interface TasksViewProps {
  initialData: {
    householdId: string;
    householdName: string;
    profiles: ProfileItem[];
    tasks: TaskItem[];
    pendingCount: number;
    completedCount: number;
    urgentCount: number;
    totalCount: number;
  };
}

export function TasksView({ initialData }: TasksViewProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialData.tasks);

  useEffect(() => {
    setTasks(initialData.tasks);
  }, [initialData.tasks]);

  useRealtime({
    table: "tasks",
    filter: `household_id=eq.${initialData.householdId}`,
  });
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "URGENT" | "COMPLETED">("ALL");
  const [filterAssignee, setFilterAssignee] = useState<string>("ALL");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [recurrence, setRecurrence] = useState<Recurrence>(Recurrence.NONE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus === "PENDING" && t.isCompleted) return false;
      if (filterStatus === "COMPLETED" && !t.isCompleted) return false;
      if (filterStatus === "URGENT" && (t.isCompleted || (!t.isUrgent && !t.isOverdue))) return false;

      if (filterAssignee !== "ALL") {
        if (filterAssignee === "UNASSIGNED" && t.assigneeId !== null) return false;
        if (filterAssignee !== "UNASSIGNED" && t.assigneeId !== filterAssignee) return false;
      }

      return true;
    });
  }, [tasks, filterStatus, filterAssignee]);

  const handleToggle = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextCompleted = !task.isCompleted;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isCompleted: nextCompleted,
              doneAt: nextCompleted ? new Date().toISOString() : null,
            }
          : t
      )
    );
    await toggleTaskAction(id, nextCompleted);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const tempId = "temp-" + Date.now();
    const assignedProfile = initialData.profiles.find((p) => p.id === assigneeId);

    const newTask: TaskItem = {
      id: tempId,
      title: title.trim(),
      assigneeId: assigneeId || null,
      assigneeName: assignedProfile?.displayName || "Bersama",
      dueDate: dueDate || null,
      dueDateFormatted: dueDate
        ? new Date(dueDate).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
        : "Fleksibel",
      recurrence,
      isCompleted: false,
      isUrgent: false,
      isOverdue: false,
      doneAt: null,
    };

    setTasks((prev) => [newTask, ...prev]);
    setTitle("");
    setDueDate("");
    setAssigneeId("");
    setRecurrence(Recurrence.NONE);
    setIsAddFormOpen(false);

    try {
      const res = await addTaskAction({
        householdId: initialData.householdId,
        title: newTask.title,
        assigneeId: newTask.assigneeId,
        dueDate: newTask.dueDate,
        recurrence: newTask.recurrence,
      });

      if (res.success && res.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: res.task.id } : t))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tugas ini?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTaskAction(id);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Page Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="font-caption-mono text-[11px] text-starbucks-green font-bold tracking-wider uppercase">
            Manajemen Pekerjaan Rumah
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-house-green font-bold tracking-tight">
            Tugas & Jadwal Rutin
          </h1>
        </div>

        <button
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
          className="btn-pill inline-flex items-center justify-center gap-2 bg-starbucks-green hover:bg-green-accent text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{isAddFormOpen ? "Tutup Form" : "Tambah Tugas"}</span>
        </button>
      </div>

      {/* 2. Urgent / Pending Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-[12px] bg-white p-4 border border-border-card shadow-starbucks-card">
          <div className="flex items-center gap-2 text-text-black-soft text-xs mb-1">
            <Clock className="h-4 w-4 text-text-black-soft" />
            <span className="font-medium">Tugas Tertunda</span>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-bold text-text-black">
            {tasks.filter((t) => !t.isCompleted).length}
          </p>
        </div>

        <div className="rounded-[12px] bg-white p-4 border border-border-card shadow-starbucks-card">
          <div className="flex items-center gap-2 text-text-black-soft text-xs mb-1">
            <AlertTriangle className="h-4 w-4 text-warm-gold" />
            <span className="font-medium">Mendesak / Hari Ini</span>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-bold text-warm-gold">
            {tasks.filter((t) => !t.isCompleted && (t.isUrgent || t.isOverdue)).length}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-[12px] bg-white p-4 border border-border-card shadow-starbucks-card">
          <div className="flex items-center gap-2 text-text-black-soft text-xs mb-1">
            <CheckSquare className="h-4 w-4 text-green-accent" />
            <span className="font-medium">Selesai</span>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-bold text-starbucks-green">
            {tasks.filter((t) => t.isCompleted).length}
          </p>
        </div>
      </div>

      {/* 3. Add Task Expandable Form */}
      {isAddFormOpen && (
        <form
          onSubmit={handleAddTask}
          className="rounded-[12px] bg-white p-5 border border-border-card shadow-starbucks-card space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border-card">
            <h3 className="font-serif text-base font-bold text-house-green">
              Buat Tugas Baru
            </h3>
            <span className="text-xs text-text-black-soft">Untuk rumah tangga bersama</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
              JUDUL TUGAS
            </label>
            <input
              type="text"
              placeholder="Contoh: Bersihkan filter dispenser & ganti filter AC"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[8px] border border-border-input bg-canvas px-3.5 py-2 text-xs text-text-black placeholder:text-text-black-soft focus:outline-none focus:border-green-accent"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
                PENANGGUNG JAWAB
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-[8px] border border-border-input bg-canvas px-3 py-2 text-xs text-text-black focus:outline-none focus:border-green-accent cursor-pointer"
              >
                <option value="">Bersama (Siapa saja)</option>
                {initialData.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
                TANGGAL JATUH TEMPO
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-[8px] border border-border-input bg-canvas px-3 py-2 text-xs text-text-black focus:outline-none focus:border-green-accent cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-black-soft mb-1.5">
                PENGULANGAN (RUTIN)
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                className="w-full rounded-[8px] border border-border-input bg-canvas px-3 py-2 text-xs text-text-black focus:outline-none focus:border-green-accent cursor-pointer"
              >
                <option value={Recurrence.NONE}>Sekali Saja (Tidak Berulang)</option>
                <option value={Recurrence.DAILY}>Harian (Setiap Hari)</option>
                <option value={Recurrence.WEEKLY}>Mingguan</option>
                <option value={Recurrence.MONTHLY}>Bulanan</option>
                <option value={Recurrence.YEARLY}>Tahunan</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="btn-pill border border-border-input bg-white px-4 py-2 text-xs font-semibold text-text-black hover:bg-canvas cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="btn-pill bg-starbucks-green hover:bg-green-accent text-white px-5 py-2 text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
            >
              Simpan Tugas
            </button>
          </div>
        </form>
      )}

      {/* 4. Filter Strip */}
      <div className="rounded-[12px] bg-white p-3.5 border border-border-card shadow-starbucks-card flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {(["ALL", "PENDING", "URGENT", "COMPLETED"] as const).map((st) => {
            const label =
              st === "ALL"
                ? "Semua"
                : st === "PENDING"
                ? "Tertunda"
                : st === "URGENT"
                ? "Mendesak"
                : "Selesai";

            const isSelected = filterStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`btn-pill px-3 py-1 text-xs border font-medium cursor-pointer transition-colors ${
                  isSelected
                    ? "border-green-accent bg-green-light text-starbucks-green font-semibold"
                    : "border-border-card bg-canvas text-text-black-soft hover:border-text-black-soft"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-semibold text-text-black-soft whitespace-nowrap">
            PJ:
          </span>
          <button
            onClick={() => setFilterAssignee("ALL")}
            className={`btn-pill px-2.5 py-0.5 text-xs border cursor-pointer font-medium ${
              filterAssignee === "ALL"
                ? "border-starbucks-green bg-starbucks-green text-white font-semibold"
                : "border-border-card bg-canvas text-text-black-soft hover:border-text-black-soft"
            }`}
          >
            Semua
          </button>
          {initialData.profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterAssignee(p.id)}
              className={`btn-pill px-2.5 py-0.5 text-xs border cursor-pointer font-medium whitespace-nowrap ${
                filterAssignee === p.id
                  ? "border-starbucks-green bg-starbucks-green text-white font-semibold"
                  : "border-border-card bg-canvas text-text-black-soft hover:border-text-black-soft"
              }`}
            >
              {p.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Tasks List */}
      <div className="rounded-[12px] bg-white border border-border-card shadow-starbucks-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border-card bg-canvas/30 flex items-center justify-between">
          <span className="font-caption-mono text-xs font-semibold text-text-black-soft uppercase">
            DAFTAR TUGAS ({filteredTasks.length})
          </span>
          <span className="text-[11px] text-text-black-soft">Centang untuk menyelesaikan</span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-14 text-center text-text-black-soft">
            <CheckSquare className="h-10 w-10 mx-auto text-warm-gold/60 mb-2" />
            <p className="text-sm font-medium text-text-black">Tidak ada tugas dalam filter ini.</p>
            <p className="text-xs text-text-black-soft mt-0.5">
              Semua tugas selesai atau belum ada tugas yang sesuai.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-card">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`px-4 sm:px-5 py-4 flex items-center justify-between transition-colors group ${
                  task.isCompleted ? "bg-canvas/20" : "hover:bg-canvas/40"
                }`}
              >
                <div
                  onClick={() => handleToggle(task.id)}
                  className="flex items-center gap-3.5 flex-1 cursor-pointer min-h-[44px]"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] transition-colors ${
                      task.isCompleted
                        ? "bg-starbucks-green text-white"
                        : "border-2 border-border-input hover:border-green-accent bg-white"
                    }`}
                  >
                    {task.isCompleted && <Check className="h-4 w-4 stroke-[3]" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`text-sm font-semibold ${
                          task.isCompleted
                            ? "text-text-black-soft line-through"
                            : "text-text-black"
                        }`}
                      >
                        {task.title}
                      </p>

                      {task.isOverdue && !task.isCompleted && (
                        <span className="font-caption-mono text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-bold">
                          TERLEWAT
                        </span>
                      )}

                      {task.isUrgent && !task.isOverdue && !task.isCompleted && (
                        <span className="font-caption-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-warm-gold border border-warm-gold/30 font-bold">
                          MENDESAK
                        </span>
                      )}

                      {task.recurrence !== Recurrence.NONE && (
                        <span className="inline-flex items-center gap-1 font-caption-mono text-[10px] px-2 py-0.5 rounded-full bg-green-light/40 text-starbucks-green border border-green-accent/20">
                          <Repeat className="h-3 w-3" />
                          {task.recurrence === Recurrence.DAILY
                            ? "Harian"
                            : task.recurrence === Recurrence.WEEKLY
                            ? "Mingguan"
                            : task.recurrence === Recurrence.MONTHLY
                            ? "Bulanan"
                            : "Tahunan"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-black-soft mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-starbucks-green font-medium">
                        <User className="h-3 w-3" />
                        {task.assigneeName}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.dueDateFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-text-black-soft hover:text-red-600 transition-colors rounded-full hover:bg-canvas cursor-pointer opacity-70 group-hover:opacity-100"
                  title="Hapus tugas"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
