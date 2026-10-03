import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "./households";

export async function getTasksPageData() {
  const household = await getOrCreateDefaultHousehold();
  const householdId = household.id;

  // 1. Fetch household profiles for assignment options
  const profiles = await prisma.profile.findMany({
    where: { householdId },
    select: { id: true, displayName: true, role: true },
  });

  // 2. Fetch all tasks
  const rawTasks = await prisma.task.findMany({
    where: { householdId },
    orderBy: [{ doneAt: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignee: { select: { id: true, displayName: true } },
    },
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const tasks = rawTasks.map((t) => {
    const isCompleted = t.doneAt !== null;
    let isUrgent = false;
    let isOverdue = false;

    if (t.dueDate && !isCompleted) {
      const dueTime = new Date(t.dueDate).getTime();
      const diffMs = dueTime - startOfDay.getTime();
      if (diffMs < 0) {
        isOverdue = true;
      } else if (diffMs <= 86400000 * 2) {
        isUrgent = true;
      }
    }

    return {
      id: t.id,
      title: t.title,
      assigneeId: t.assigneeId,
      assigneeName: t.assignee?.displayName || "Bersama",
      dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
      dueDateFormatted: t.dueDate
        ? t.dueDate.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Fleksibel",
      recurrence: t.recurrence,
      isCompleted,
      isUrgent,
      isOverdue,
      doneAt: t.doneAt?.toISOString() || null,
    };
  });

  const pendingCount = tasks.filter((t) => !t.isCompleted).length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const urgentCount = tasks.filter((t) => t.isUrgent || t.isOverdue).length;

  return {
    householdId,
    householdName: household.name,
    profiles,
    tasks,
    pendingCount,
    completedCount,
    urgentCount,
    totalCount: tasks.length,
  };
}
