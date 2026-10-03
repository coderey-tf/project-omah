import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

// Format date to iCal DATE format: YYYYMMDD
function formatIcalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// Format date to iCal UTC format: YYYYMMDDTHHMMSSZ
function formatIcalUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Escape special characters in iCal text
function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return new NextResponse("Token wajib disertakan", { status: 400 });
  }

  // Find household by icalToken
  const household = await prisma.household.findUnique({
    where: { icalToken: token },
    include: {
      recurringBills: {
        where: { deletedAt: null },
      },
      tasks: {
        where: { doneAt: null, dueDate: { not: null } },
        include: { assignee: { select: { displayName: true } } },
      },
      reminders: {
        where: { deletedAt: null, doneAt: null },
      },
    },
  });

  if (!household) {
    return new NextResponse("Kalender rumah tangga tidak ditemukan", { status: 404 });
  }

  const now = new Date();
  const dtstamp = formatIcalUtc(now);
  const events: string[] = [];

  // 1. Generate Recurring Bills
  for (const bill of household.recurringBills) {
    const dueDay = Math.min(Math.max(bill.dueDay, 1), 28);
    // Start date in current year/month
    const startDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
    const dtstart = formatIcalDate(startDate);
    const amountStr = formatRupiah(Number(bill.amount));

    let rrule = "RRULE:FREQ=MONTHLY";
    if (bill.period === "YEARLY" && bill.dueMonth) {
      rrule = `RRULE:FREQ=YEARLY;BYMONTH=${bill.dueMonth};BYMONTHDAY=${dueDay}`;
    }

    events.push([
      "BEGIN:VEVENT",
      `UID:bill-${bill.id}@omah.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `SUMMARY:${escapeIcalText(`💳 Tagihan: ${bill.name} (${amountStr})`)}`,
      `DESCRIPTION:${escapeIcalText(`Tagihan rutin ${bill.name} sebesar ${amountStr}. Jatuh tempo setiap tanggal ${bill.dueDay}.`)}`,
      rrule,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ].join("\r\n"));
  }

  // 2. Generate Tasks
  for (const task of household.tasks) {
    if (!task.dueDate) continue;

    const dtstart = formatIcalDate(task.dueDate);
    const assigneeName = task.assignee?.displayName || "Bersama";

    const taskLines = [
      "BEGIN:VEVENT",
      `UID:task-${task.id}@omah.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `SUMMARY:${escapeIcalText(`📋 Tugas: ${task.title}`)}`,
      `DESCRIPTION:${escapeIcalText(`Penanggung Jawab: ${assigneeName}`)}`,
    ];

    if (task.recurrence === "DAILY") {
      taskLines.push("RRULE:FREQ=DAILY");
    } else if (task.recurrence === "WEEKLY") {
      taskLines.push("RRULE:FREQ=WEEKLY");
    } else if (task.recurrence === "MONTHLY") {
      taskLines.push("RRULE:FREQ=MONTHLY");
    } else if (task.recurrence === "YEARLY") {
      taskLines.push("RRULE:FREQ=YEARLY");
    }

    taskLines.push("STATUS:CONFIRMED");
    taskLines.push("END:VEVENT");

    events.push(taskLines.join("\r\n"));
  }

  // 3. Generate Reminders
  for (const reminder of household.reminders) {
    const dtstart = formatIcalDate(reminder.dueDate);

    const reminderLines = [
      "BEGIN:VEVENT",
      `UID:reminder-${reminder.id}@omah.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `SUMMARY:${escapeIcalText(`🔔 Pengingat: ${reminder.title}`)}`,
      `DESCRIPTION:${escapeIcalText(reminder.note || "Pengingat dokumen/tanggal penting rumah tangga")}`,
    ];

    if (reminder.recurrence === "DAILY") {
      reminderLines.push("RRULE:FREQ=DAILY");
    } else if (reminder.recurrence === "WEEKLY") {
      reminderLines.push("RRULE:FREQ=WEEKLY");
    } else if (reminder.recurrence === "MONTHLY") {
      reminderLines.push("RRULE:FREQ=MONTHLY");
    } else if (reminder.recurrence === "YEARLY") {
      reminderLines.push("RRULE:FREQ=YEARLY");
    }

    reminderLines.push("STATUS:CONFIRMED");
    reminderLines.push("END:VEVENT");

    events.push(reminderLines.join("\r\n"));
  }

  const calendarContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Omah System//Household Management//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcalText(`Omah — ${household.name}`)}`,
    "X-WR-TIMEZONE:Asia/Jakarta",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(calendarContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="omah-${household.id}.ics"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
