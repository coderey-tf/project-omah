import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Recurrence, BillPeriod, CategoryKind } from "@prisma/client";

export async function getOrCreateDefaultHousehold() {
  // Check if any household exists
  let household = await prisma.household.findFirst({
    include: {
      wallets: true,
      categories: true,
      profiles: true,
    },
  });

  if (!household) {
    const adminProfileId = crypto.randomUUID();
    const partnerProfileId = crypto.randomUUID();

    // Seed default household for Admin & Partner
    household = await prisma.household.create({
      data: {
        name: "Keluarga Bahagia",
        periodStartDay: 1,
        icalToken: crypto.randomUUID(),
        profiles: {
          create: [
            {
              id: adminProfileId,
              displayName: "Suami",
              role: "ADMIN",
            },
            {
              id: partnerProfileId,
              displayName: "Istri",
              role: "MEMBER",
            },
          ],
        },
        wallets: {
          create: [
            {
              name: "BCA Rekening Bersama",
              type: "BANK",
              openingBalance: BigInt(14200000),
            },
            {
              name: "Kas Tunai Dompet",
              type: "CASH",
              openingBalance: BigInt(1750000),
            },
            {
              name: "GoPay / OVO Kebutuhan",
              type: "EWALLET",
              openingBalance: BigInt(2500000),
            },
          ],
        },
        categories: {
          create: [
            { name: "Bahan Makanan", kind: CategoryKind.EXPENSE, icon: "Utensils" },
            { name: "Makan Luar", kind: CategoryKind.EXPENSE, icon: "Coffee" },
            { name: "Transportasi", kind: CategoryKind.EXPENSE, icon: "Car" },
            { name: "Utilitas Rumah", kind: CategoryKind.EXPENSE, icon: "Zap" },
            { name: "Kesehatan", kind: CategoryKind.EXPENSE, icon: "Heart" },
            { name: "Gaji & Pemasukan", kind: CategoryKind.INCOME, icon: "TrendingUp" },
            { name: "Bonus & Proyek", kind: CategoryKind.INCOME, icon: "Gift" },
          ],
        },
      },
      include: {
        wallets: true,
        categories: true,
        profiles: true,
      },
    });

    // Also seed default tasks, bills, and shopping list if fresh
    await prisma.shoppingList.create({
      data: {
        householdId: household.id,
        name: "Kebutuhan Dapur & Mingguan",
        items: {
          create: [
            { householdId: household.id, name: "Beras Rojolele 5kg", quantity: "1 sak", checked: false, sortOrder: 0 },
            { householdId: household.id, name: "Minyak Goreng 2 Liter", quantity: "1 pouch", checked: false, sortOrder: 1 },
            { householdId: household.id, name: "Telur Ayam Negeri", quantity: "1 kg", checked: true, sortOrder: 2 },
            { householdId: household.id, name: "Sabun Cuci Piring", quantity: "2 bungkus", checked: false, sortOrder: 3 },
          ],
        },
      },
    });

    await prisma.task.createMany({
      data: [
        {
          householdId: household.id,
          assigneeId: adminProfileId,
          title: "Buang sampah & bersihkan filter AC",
          dueDate: new Date(),
          recurrence: Recurrence.WEEKLY,
          doneAt: null,
        },
        {
          householdId: household.id,
          title: "Ganti galon air minum & gas elpiji dapur",
          dueDate: new Date(Date.now() + 86400000),
          recurrence: Recurrence.NONE,
          doneAt: null,
        },
        {
          householdId: household.id,
          assigneeId: partnerProfileId,
          title: "Jemur kasur & cuci sprei kamar utama",
          dueDate: new Date(Date.now() + 86400000 * 2),
          recurrence: Recurrence.WEEKLY,
          doneAt: null,
        },
      ],
    });

    await prisma.recurringBill.createMany({
      data: [
        {
          householdId: household.id,
          name: "Listrik PLN Pascabayar",
          amount: BigInt(450000),
          dueDay: 3,
          period: BillPeriod.MONTHLY,
          remindDaysBefore: [3, 0],
        },
        {
          householdId: household.id,
          name: "Internet & WiFi Rumah",
          amount: BigInt(385000),
          dueDay: 1,
          period: BillPeriod.MONTHLY,
          remindDaysBefore: [3, 0],
        },
      ],
    });
  }

  return household;
}
