"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { deleteKondangan } from "@/lib/data/kondangan";
import { KondanganType, AuditAction, TransactionType, CategoryKind } from "@prisma/client";

export async function createKondanganAction(formData: FormData) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const currentProfile = household.profiles[0];

    const type = (formData.get("type") as KondanganType) || KondanganType.GIVEN;
    const personName = (formData.get("personName") as string)?.trim();
    const eventName = (formData.get("eventName") as string)?.trim();
    const eventDateStr = (formData.get("eventDate") as string)?.trim();
    const amountStr = (formData.get("amount") as string)?.trim() || "";
    const giftItem = (formData.get("giftItem") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const createTransaction = formData.get("createTransaction") === "true";
    const walletId = (formData.get("walletId") as string)?.trim() || null;

    if (!personName) {
      return { success: false, error: "Nama kerabat / orang yang punya hajat wajib diisi" };
    }
    if (!eventName) {
      return { success: false, error: "Nama acara wajib diisi (contoh: Pernikahan Budi & Ani)" };
    }
    if (!eventDateStr) {
      return { success: false, error: "Tanggal acara wajib dipilih" };
    }

    const amountNum = parseInt(amountStr.replace(/\D/g, ""), 10) || null;
    const amountBigInt = amountNum ? BigInt(amountNum) : null;
    const eventDate = new Date(`${eventDateStr}T00:00:00.000Z`);

    let transactionId: string | null = null;

    // Auto-create EXPENSE transaction if we gave money and requested auto-transaction
    if (type === KondanganType.GIVEN && amountBigInt && createTransaction && walletId) {
      let category = await prisma.category.findFirst({
        where: {
          householdId: household.id,
          name: "Kondangan & Hadiah",
          kind: CategoryKind.EXPENSE,
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            householdId: household.id,
            name: "Kondangan & Hadiah",
            kind: CategoryKind.EXPENSE,
            icon: "Gift",
          },
        });
      }

      const tx = await prisma.transaction.create({
        data: {
          householdId: household.id,
          type: TransactionType.EXPENSE,
          amount: amountBigInt,
          categoryId: category.id,
          walletId,
          occurredOn: eventDate,
          note: `Kondangan: ${eventName} (${personName})`,
          createdById: currentProfile.id,
        },
      });
      transactionId = tx.id;
    }

    const record = await prisma.kondanganRecord.create({
      data: {
        householdId: household.id,
        type,
        personName,
        eventName,
        eventDate,
        amount: amountBigInt,
        giftItem,
        notes,
        transactionId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        householdId: household.id,
        actorId: currentProfile.id,
        entity: "KONDANGAN_RECORD",
        entityId: record.id,
        action: AuditAction.CREATE,
        diff: { type, personName, eventName, amount: amountNum },
      },
    });

    revalidatePath("/kondangan");
    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true, recordId: record.id };
  } catch (error: any) {
    console.error("createKondanganAction error:", error);
    return { success: false, error: error.message || "Gagal mencatat data kondangan" };
  }
}

export async function deleteKondanganAction(id: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const currentProfile = household.profiles[0];

    await deleteKondangan(id, household.id);

    await prisma.auditLog.create({
      data: {
        householdId: household.id,
        actorId: currentProfile.id,
        entity: "KONDANGAN_RECORD",
        entityId: id,
        action: AuditAction.DELETE,
        diff: { deleted: true },
      },
    });

    revalidatePath("/kondangan");
    return { success: true };
  } catch (error: any) {
    console.error("deleteKondanganAction error:", error);
    return { success: false, error: error.message || "Gagal menghapus catatan kondangan" };
  }
}
