"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Recurrence } from "@prisma/client";

export async function toggleTaskAction(taskId: string, isCompleted: boolean) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        doneAt: isCompleted ? new Date() : null,
      },
    });
    revalidatePath("/");
    revalidatePath("/tasks");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengubah status tugas" };
  }
}

export async function addTaskAction(input: {
  householdId: string;
  title: string;
  assigneeId?: string | null;
  dueDate?: string | null;
  recurrence?: Recurrence;
}) {
  try {
    const task = await prisma.task.create({
      data: {
        householdId: input.householdId,
        title: input.title.trim(),
        assigneeId: input.assigneeId || null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        recurrence: input.recurrence || Recurrence.NONE,
      },
    });
    revalidatePath("/");
    revalidatePath("/tasks");
    return { success: true, task };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menambah tugas baru" };
  }
}

export async function deleteTaskAction(taskId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    revalidatePath("/");
    revalidatePath("/tasks");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus tugas" };
  }
}
