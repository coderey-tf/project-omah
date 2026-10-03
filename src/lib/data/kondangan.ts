import { prisma } from "@/lib/prisma";
import { KondanganType } from "@prisma/client";

export interface KondanganItem {
  id: string;
  householdId: string;
  type: KondanganType;
  personName: string;
  eventName: string;
  eventDate: string;
  amount: number | null;
  giftItem: string | null;
  notes: string | null;
  transactionId: string | null;
  createdAt: string;
}

export async function getKondanganRecords(
  householdId: string,
  typeFilter?: KondanganType
): Promise<{
  records: KondanganItem[];
  totalReceived: number;
  totalGiven: number;
  totalCount: number;
}> {
  const whereClause: any = {
    householdId,
    deletedAt: null,
  };

  if (typeFilter) {
    whereClause.type = typeFilter;
  }

  const records = await prisma.kondanganRecord.findMany({
    where: whereClause,
    orderBy: {
      eventDate: "desc",
    },
  });

  // Calculate totals across ALL active records
  const allActive = await prisma.kondanganRecord.findMany({
    where: { householdId, deletedAt: null },
    select: { type: true, amount: true },
  });

  let totalReceived = 0;
  let totalGiven = 0;

  for (const item of allActive) {
    const val = item.amount ? Number(item.amount) : 0;
    if (item.type === KondanganType.RECEIVED) {
      totalReceived += val;
    } else if (item.type === KondanganType.GIVEN) {
      totalGiven += val;
    }
  }

  const formatted: KondanganItem[] = records.map((r) => ({
    id: r.id,
    householdId: r.householdId,
    type: r.type,
    personName: r.personName,
    eventName: r.eventName,
    eventDate: r.eventDate.toISOString().split("T")[0],
    amount: r.amount ? Number(r.amount) : null,
    giftItem: r.giftItem,
    notes: r.notes,
    transactionId: r.transactionId,
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    records: formatted,
    totalReceived,
    totalGiven,
    totalCount: formatted.length,
  };
}

export async function searchReciprocal(householdId: string, query: string) {
  if (!query || query.trim().length < 2) return [];

  const records = await prisma.kondanganRecord.findMany({
    where: {
      householdId,
      deletedAt: null,
      personName: {
        contains: query.trim(),
        mode: "insensitive",
      },
    },
    orderBy: {
      eventDate: "desc",
    },
  });

  return records.map((r) => ({
    id: r.id,
    type: r.type,
    personName: r.personName,
    eventName: r.eventName,
    eventDate: r.eventDate.toISOString().split("T")[0],
    amount: r.amount ? Number(r.amount) : null,
    giftItem: r.giftItem,
  }));
}

export async function deleteKondangan(id: string, householdId: string) {
  const item = await prisma.kondanganRecord.findFirst({
    where: { id, householdId, deletedAt: null },
  });

  if (!item) {
    throw new Error("Catatan tidak ditemukan atau bukan milik household ini");
  }

  await prisma.kondanganRecord.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
}
