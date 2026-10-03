import { prisma } from "@/lib/prisma";
import { Recurrence } from "@prisma/client";

export interface EnrichedReminder {
  id: string;
  title: string;
  dueDate: string;
  dueDateFormatted: string;
  recurrence: Recurrence;
  remindDaysBefore: number[];
  note: string | null;
  doneAt: string | null;
  isCompleted: boolean;
  daysUntilDue: number;
  isOverdue: boolean;
  urgencyStatus: "OVERDUE" | "TODAY" | "SOON" | "UPCOMING" | "DONE";
  createdAt: string;
}

/**
 * Menghitung hari tersisa dan status urgensi pengingat
 */
export function calculateReminderStatus(dueDate: Date, doneAt: Date | null, now = new Date()) {
  const isCompleted = doneAt !== null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = due.getTime() - startOfToday.getTime();
  const daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = !isCompleted && daysUntilDue < 0;

  let urgencyStatus: EnrichedReminder["urgencyStatus"] = "UPCOMING";
  if (isCompleted) {
    urgencyStatus = "DONE";
  } else if (daysUntilDue < 0) {
    urgencyStatus = "OVERDUE";
  } else if (daysUntilDue === 0) {
    urgencyStatus = "TODAY";
  } else if (daysUntilDue <= 7) {
    urgencyStatus = "SOON";
  } else {
    urgencyStatus = "UPCOMING";
  }

  return { daysUntilDue, isOverdue, isCompleted, urgencyStatus };
}

/**
 * Mengambil semua pengingat dokumen aktif untuk household
 */
export async function getReminders(householdId: string): Promise<EnrichedReminder[]> {
  const rawReminders = await prisma.reminder.findMany({
    where: { householdId, deletedAt: null },
    orderBy: [{ doneAt: "asc" }, { dueDate: "asc" }],
  });

  const now = new Date();

  return rawReminders.map((r) => {
    const { daysUntilDue, isOverdue, isCompleted, urgencyStatus } = calculateReminderStatus(
      r.dueDate,
      r.doneAt,
      now
    );

    const dueDateFormatted = r.dueDate.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      id: r.id,
      title: r.title,
      dueDate: r.dueDate.toISOString(),
      dueDateFormatted,
      recurrence: r.recurrence,
      remindDaysBefore: r.remindDaysBefore,
      note: r.note,
      doneAt: r.doneAt ? r.doneAt.toISOString() : null,
      isCompleted,
      daysUntilDue,
      isOverdue,
      urgencyStatus,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

/**
 * Membuat pengingat dokumen baru
 */
export async function createReminder(
  householdId: string,
  data: {
    title: string;
    dueDate: Date | string;
    recurrence?: Recurrence;
    remindDaysBefore?: number[];
    note?: string | null;
  }
) {
  const reminder = await prisma.reminder.create({
    data: {
      householdId,
      title: data.title,
      dueDate: new Date(data.dueDate),
      recurrence: data.recurrence || Recurrence.NONE,
      remindDaysBefore: data.remindDaysBefore || [30, 7, 0],
      note: data.note || null,
    },
  });

  return reminder;
}

/**
 * Update pengingat dokumen
 */
export async function updateReminder(
  reminderId: string,
  householdId: string,
  data: {
    title: string;
    dueDate: Date | string;
    recurrence?: Recurrence;
    remindDaysBefore?: number[];
    note?: string | null;
  }
) {
  const existing = await prisma.reminder.findFirst({
    where: { id: reminderId, householdId, deletedAt: null },
  });

  if (!existing) {
    throw new Error("Pengingat tidak ditemukan");
  }

  const updated = await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      title: data.title,
      dueDate: new Date(data.dueDate),
      recurrence: data.recurrence || Recurrence.NONE,
      remindDaysBefore: data.remindDaysBefore || [30, 7, 0],
      note: data.note || null,
    },
  });

  return updated;
}

/**
 * Menandai pengingat selesai.
 * Untuk ulangan (recurrence != NONE), tanggal dimajukan ke siklus berikutnya.
 * Untuk sekali jalan (NONE), isi doneAt.
 */
export async function markReminderDone(reminderId: string, householdId: string) {
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, householdId, deletedAt: null },
  });

  if (!reminder) {
    throw new Error("Pengingat tidak ditemukan");
  }

  if (reminder.recurrence === Recurrence.NONE) {
    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: { doneAt: new Date() },
    });
    return { reminder: updated, advanced: false };
  }

  // Recurrence != NONE: majukan dueDate ke siklus berikutnya
  const currentDue = new Date(reminder.dueDate);
  let nextDue = new Date(currentDue);

  switch (reminder.recurrence) {
    case Recurrence.DAILY:
      nextDue.setDate(nextDue.getDate() + 1);
      break;
    case Recurrence.WEEKLY:
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    case Recurrence.MONTHLY:
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
    case Recurrence.YEARLY:
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      break;
  }

  const updated = await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      dueDate: nextDue,
      doneAt: null, // Siap untuk siklus berikutnya
    },
  });

  return { reminder: updated, advanced: true, nextDueDate: nextDue };
}

/**
 * Membatalkan tanda selesai
 */
export async function unmarkReminderDone(reminderId: string, householdId: string) {
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, householdId, deletedAt: null },
  });

  if (!reminder) {
    throw new Error("Pengingat tidak ditemukan");
  }

  const updated = await prisma.reminder.update({
    where: { id: reminderId },
    data: { doneAt: null },
  });

  return updated;
}

/**
 * Hapus pengingat (soft delete)
 */
export async function deleteReminder(reminderId: string, householdId: string) {
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, householdId, deletedAt: null },
  });

  if (!reminder) {
    throw new Error("Pengingat tidak ditemukan");
  }

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { deletedAt: new Date() },
  });

  return { success: true };
}
