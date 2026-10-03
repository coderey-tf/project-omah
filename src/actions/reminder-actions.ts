"use server";

import { CreateReminderSchema, UpdateReminderSchema } from "@/types/schemas";
import {
  createReminder,
  updateReminder,
  markReminderDone,
  unmarkReminderDone,
  deleteReminder,
} from "@/lib/data/reminders";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { revalidatePath } from "next/cache";
import { Recurrence } from "@prisma/client";

export async function createReminderAction(input: unknown) {
  try {
    const parsed = CreateReminderSchema.parse(input);
    const household = await getOrCreateDefaultHousehold();

    const result = await createReminder(household.id, {
      title: parsed.title,
      dueDate: parsed.dueDate,
      recurrence: parsed.recurrence as Recurrence,
      remindDaysBefore: parsed.remindDaysBefore,
      note: parsed.note || null,
    });

    revalidatePath("/reminders");
    revalidatePath("/");

    return {
      success: true,
      message: "Pengingat dokumen berhasil dibuat",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal membuat pengingat",
    };
  }
}

export async function updateReminderAction(input: unknown) {
  try {
    const parsed = UpdateReminderSchema.parse(input);
    const household = await getOrCreateDefaultHousehold();

    const result = await updateReminder(parsed.id, household.id, {
      title: parsed.title,
      dueDate: parsed.dueDate,
      recurrence: parsed.recurrence as Recurrence,
      remindDaysBefore: parsed.remindDaysBefore,
      note: parsed.note || null,
    });

    revalidatePath("/reminders");
    revalidatePath("/");

    return {
      success: true,
      message: "Pengingat dokumen berhasil diperbarui",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memperbarui pengingat",
    };
  }
}

export async function markReminderDoneAction(reminderId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const result = await markReminderDone(reminderId, household.id);

    revalidatePath("/reminders");
    revalidatePath("/");

    return {
      success: true,
      message: result.advanced
        ? `Pengingat selesai dan dimajukan ke siklus berikutnya (${result.nextDueDate?.toLocaleDateString("id-ID")})`
        : "Pengingat berhasil ditandai selesai",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menandai selesai",
    };
  }
}

export async function unmarkReminderDoneAction(reminderId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const result = await unmarkReminderDone(reminderId, household.id);

    revalidatePath("/reminders");
    revalidatePath("/");

    return {
      success: true,
      message: "Status selesai dibatalkan",
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal membatalkan status selesai",
    };
  }
}

export async function deleteReminderAction(reminderId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    await deleteReminder(reminderId, household.id);

    revalidatePath("/reminders");
    revalidatePath("/");

    return {
      success: true,
      message: "Pengingat berhasil dihapus",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menghapus pengingat",
    };
  }
}
