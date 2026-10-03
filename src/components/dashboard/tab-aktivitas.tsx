"use client";

import Link from "next/link";
import {
  CheckSquare,
  ShoppingCart,
  Calendar,
  User,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { toggleTaskAction } from "@/actions/task-actions";
import { toggleShoppingItemAction } from "@/actions/shopping-actions";

interface TaskItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  isUrgent: boolean;
  completed: boolean;
  recurrence?: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

interface TabAktivitasProps {
  initialTasks?: TaskItem[];
  initialShoppingItems?: ShoppingItem[];
}

export function TabAktivitas({
  initialTasks,
  initialShoppingItems,
}: TabAktivitasProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(
    initialTasks || [
      {
        id: "tk1",
        title: "Buang sampah & bersihkan kotak filter AC",
        assignee: "Suami",
        dueDate: "Hari ini (Mendesak)",
        isUrgent: true,
        completed: false,
        recurrence: "Mingguan",
      },
      {
        id: "tk2",
        title: "Ganti galon air minum & gas elpiji dapur",
        assignee: "Bersama",
        dueDate: "Besok pagi",
        isUrgent: false,
        completed: false,
      },
      {
        id: "tk3",
        title: "Jemur kasur & cuci sprei kamar utama",
        assignee: "Istri",
        dueDate: "Sabtu, 3 Okt",
        isUrgent: false,
        completed: false,
        recurrence: "2 Mingguan",
      },
      {
        id: "tk4",
        title: "Service berkala motor Honda Vario",
        assignee: "Suami",
        dueDate: "5 Okt 2026",
        isUrgent: false,
        completed: false,
      },
    ]
  );

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(
    initialShoppingItems || [
      { id: "s1", name: "Beras Rojolele 5kg", quantity: "1 sak", category: "Dapur", checked: false },
      { id: "s2", name: "Minyak Goreng 2 Liter", quantity: "1 pouch", category: "Dapur", checked: false },
      { id: "s3", name: "Telur Ayam Negeri", quantity: "1 kg", category: "Dapur", checked: true },
      { id: "s4", name: "Sabun Cuci Piring & Spon", quantity: "2 bungkus", category: "Kebersihan", checked: false },
    ]
  );

  const toggleTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextCompleted = !target.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    );
    await toggleTaskAction(id, nextCompleted);
  };

  const toggleShopping = async (id: string) => {
    const target = shoppingItems.find((s) => s.id === id);
    if (!target) return;
    const nextChecked = !target.checked;
    setShoppingItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: nextChecked } : s))
    );
    await toggleShoppingItemAction(id, nextChecked);
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const pendingShoppingCount = shoppingItems.filter((s) => !s.checked).length;

  return (
    <div className="space-y-6">
      {/* 1. TUGAS RUMAH TANGGA (URGENCY-FIRST) */}
      <section className="rounded-[12px] bg-white p-6 shadow-starbucks-card border border-border-card">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-card">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-caption-mono text-xs text-starbucks-green font-bold">
                TUGAS RUMAH TANGGA
              </span>
              <span className="btn-pill text-[10px] bg-green-light text-starbucks-green px-2.5 py-0.5 font-bold">
                {pendingTasksCount} BELUM SELESAI
              </span>
            </div>
            <h3 className="text-base text-text-black font-bold">
              Urutan Berdasarkan Deadline Terdekat
            </h3>
          </div>

          <Link
            href="/tasks"
            className="btn-pill border border-green-accent text-green-accent hover:bg-green-light/30 px-3.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <span>Semua Tugas</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`flex items-start sm:items-center justify-between gap-3 rounded-[12px] p-3.5 cursor-pointer transition-all border ${
                task.completed
                  ? "border-border-card bg-canvas/40 opacity-60"
                  : task.isUrgent
                  ? "border-warning/60 bg-amber-50/50"
                  : "border-border-card bg-white hover:border-green-accent"
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {}}
                  className="mt-0.5 sm:mt-0 h-4 w-4 rounded-[4px] border-border-input text-green-accent accent-green-accent cursor-pointer"
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      task.completed ? "line-through text-text-black-soft" : "text-text-black"
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-black-soft">
                    <span className="flex items-center gap-1 text-starbucks-green font-medium">
                      <User className="h-3.5 w-3.5" />
                      {task.assignee}
                    </span>
                    <span>·</span>
                    <span
                      className={`flex items-center gap-1 font-medium ${
                        task.isUrgent ? "text-amber-800 font-semibold" : "text-text-black-soft"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {task.dueDate}
                    </span>
                    {task.recurrence && (
                      <>
                        <span>·</span>
                        <span className="text-text-black-soft">{task.recurrence}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {task.completed && (
                <span className="btn-pill text-[10px] text-starbucks-green px-2.5 py-0.5 bg-green-light font-bold shrink-0">
                  SELESAI
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. DAFTAR BELANJA AKTIF */}
      <section className="rounded-[12px] bg-white p-6 shadow-starbucks-card border border-border-card">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-card">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-caption-mono text-xs text-starbucks-green font-bold">
                DAFTAR BELANJA AKTIF
              </span>
              <span className="btn-pill text-[10px] bg-green-light text-starbucks-green px-2.5 py-0.5 font-bold">
                {pendingShoppingCount} PERLU DIBELI
              </span>
            </div>
            <h3 className="text-base text-text-black font-bold">
              Checklist Kebutuhan Bersama
            </h3>
          </div>

          <Link
            href="/shopping"
            className="btn-pill border border-green-accent text-green-accent hover:bg-green-light/30 px-3.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <span>Buka List Belanja</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-border-card">
          {shoppingItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleShopping(item.id)}
              className="flex items-center justify-between py-3 px-2 hover:bg-canvas/50 rounded-[8px] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => {}}
                  className="h-4 w-4 rounded-[4px] border-border-input text-green-accent accent-green-accent cursor-pointer"
                />
                <span
                  className={`text-sm font-medium ${
                    item.checked ? "line-through text-text-black-soft" : "text-text-black"
                  }`}
                >
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-black-soft font-medium">
                <span className="bg-canvas px-2 py-0.5 rounded-full font-semibold">
                  {item.quantity}
                </span>
                <span className="hidden sm:inline">· {item.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
