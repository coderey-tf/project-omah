"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { deleteAsset, deleteServiceLog } from "@/lib/data/assets";
import { AssetType, AuditAction, Recurrence, TransactionType, CategoryKind } from "@prisma/client";

export async function createAssetAction(formData: FormData) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const currentProfile = household.profiles[0];

    const name = (formData.get("name") as string)?.trim();
    const type = (formData.get("type") as AssetType) || AssetType.OTHER;
    const brandModel = (formData.get("brandModel") as string)?.trim() || null;
    const purchaseDateStr = (formData.get("purchaseDate") as string)?.trim() || null;
    const purchasePriceStr = (formData.get("purchasePrice") as string)?.trim() || null;
    const serialNumber = (formData.get("serialNumber") as string)?.trim() || null;
    const warrantyExpiryStr = (formData.get("warrantyExpiry") as string)?.trim() || null;
    const licensePlate = (formData.get("licensePlate") as string)?.trim() || null;
    const currentMileageStr = (formData.get("currentMileage") as string)?.trim() || null;
    const note = (formData.get("note") as string)?.trim() || null;
    const createWarrantyReminder = formData.get("createWarrantyReminder") === "true";

    if (!name) {
      return { success: false, error: "Nama aset wajib diisi" };
    }

    const purchasePrice = purchasePriceStr ? BigInt(parseInt(purchasePriceStr.replace(/\D/g, ""), 10) || 0) : null;
    const currentMileage = currentMileageStr ? parseInt(currentMileageStr.replace(/\D/g, ""), 10) : null;
    const purchaseDate = purchaseDateStr ? new Date(`${purchaseDateStr}T00:00:00.000Z`) : null;
    const warrantyExpiry = warrantyExpiryStr ? new Date(`${warrantyExpiryStr}T00:00:00.000Z`) : null;

    const newAsset = await prisma.asset.create({
      data: {
        householdId: household.id,
        name,
        type,
        brandModel,
        purchaseDate,
        purchasePrice,
        serialNumber,
        warrantyExpiry,
        licensePlate,
        currentMileage,
        note,
      },
    });

    if (warrantyExpiry && createWarrantyReminder) {
      await prisma.reminder.create({
        data: {
          householdId: household.id,
          title: `Garansi Habis: ${name}`,
          dueDate: warrantyExpiry,
          recurrence: Recurrence.NONE,
          remindDaysBefore: [30, 7, 0],
          note: `Pengingat otomatis masa garansi aset ${name} (${brandModel || ""})`,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        householdId: household.id,
        actorId: currentProfile.id,
        entity: "ASSET",
        entityId: newAsset.id,
        action: AuditAction.CREATE,
        diff: { name, type, brandModel, purchasePrice: purchasePriceStr },
      },
    });

    revalidatePath("/assets");
    revalidatePath("/reminders");

    return { success: true, assetId: newAsset.id };
  } catch (error: any) {
    console.error("createAssetAction error:", error);
    return { success: false, error: error.message || "Gagal menambahkan aset" };
  }
}

export async function deleteAssetAction(assetId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const currentProfile = household.profiles[0];

    await deleteAsset(assetId, household.id);

    await prisma.auditLog.create({
      data: {
        householdId: household.id,
        actorId: currentProfile.id,
        entity: "ASSET",
        entityId: assetId,
        action: AuditAction.DELETE,
        diff: { deleted: true },
      },
    });

    revalidatePath("/assets");
    return { success: true };
  } catch (error: any) {
    console.error("deleteAssetAction error:", error);
    return { success: false, error: error.message || "Gagal menghapus aset" };
  }
}

export async function addServiceLogAction(formData: FormData) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const currentProfile = household.profiles[0];

    const assetId = (formData.get("assetId") as string)?.trim();
    const serviceDateStr = (formData.get("serviceDate") as string)?.trim();
    const mileageStr = (formData.get("mileage") as string)?.trim() || null;
    const serviceCenter = (formData.get("serviceCenter") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim();
    const costStr = (formData.get("cost") as string)?.trim() || "0";
    const nextDueDateStr = (formData.get("nextDueDate") as string)?.trim() || null;
    const nextMileageStr = (formData.get("nextMileage") as string)?.trim() || null;
    const createTransaction = formData.get("createTransaction") === "true";
    const walletId = (formData.get("walletId") as string)?.trim() || null;

    if (!assetId) {
      return { success: false, error: "Aset wajib dipilih" };
    }
    if (!description) {
      return { success: false, error: "Deskripsi tindakan servis wajib diisi" };
    }
    if (!serviceDateStr) {
      return { success: false, error: "Tanggal servis wajib diisi" };
    }

    const asset = await prisma.asset.findFirst({
      where: { id: assetId, householdId: household.id, deletedAt: null },
    });

    if (!asset) {
      return { success: false, error: "Aset tidak ditemukan" };
    }

    const costNum = parseInt(costStr.replace(/\D/g, ""), 10) || 0;
    const costBigInt = BigInt(costNum);
    const mileage = mileageStr ? parseInt(mileageStr.replace(/\D/g, ""), 10) : null;
    const nextMileage = nextMileageStr ? parseInt(nextMileageStr.replace(/\D/g, ""), 10) : null;
    const serviceDate = new Date(`${serviceDateStr}T00:00:00.000Z`);
    const nextDueDate = nextDueDateStr ? new Date(`${nextDueDateStr}T00:00:00.000Z`) : null;

    let transactionId: string | null = null;

    // Auto-create transaction if requested and cost > 0
    if (createTransaction && costNum > 0 && walletId) {
      // Find or create "Perawatan & Servis" category
      let category = await prisma.category.findFirst({
        where: {
          householdId: household.id,
          name: "Perawatan & Servis",
          kind: CategoryKind.EXPENSE,
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            householdId: household.id,
            name: "Perawatan & Servis",
            kind: CategoryKind.EXPENSE,
            icon: "Wrench",
          },
        });
      }

      const tx = await prisma.transaction.create({
        data: {
          householdId: household.id,
          type: TransactionType.EXPENSE,
          amount: costBigInt,
          categoryId: category.id,
          walletId,
          occurredOn: serviceDate,
          note: `Servis ${asset.name}: ${description} (${serviceCenter || "Bengkel"})`,
          createdById: currentProfile.id,
        },
      });
      transactionId = tx.id;
    }

    // Create service log
    const log = await prisma.assetServiceLog.create({
      data: {
        assetId,
        householdId: household.id,
        serviceDate,
        mileage,
        serviceCenter,
        description,
        cost: costBigInt,
        transactionId,
        nextDueDate,
        nextMileage,
      },
    });

    // Update currentMileage on asset if higher
    if (mileage && (!asset.currentMileage || mileage > asset.currentMileage)) {
      await prisma.asset.update({
        where: { id: assetId },
        data: { currentMileage: mileage },
      });
    }

    // Create reminder for next service if set
    if (nextDueDate) {
      await prisma.reminder.create({
        data: {
          householdId: household.id,
          title: `Jadwal Servis Berkala: ${asset.name}`,
          dueDate: nextDueDate,
          recurrence: Recurrence.NONE,
          remindDaysBefore: [7, 0],
          note: `Estimasi servis berikutnya untuk ${asset.name} (KM target: ${nextMileage || "-"})`,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        householdId: household.id,
        actorId: currentProfile.id,
        entity: "ASSET_SERVICE_LOG",
        entityId: log.id,
        action: AuditAction.CREATE,
        diff: { assetId, description, cost: costNum, serviceCenter },
      },
    });

    revalidatePath("/assets");
    revalidatePath("/transactions");
    revalidatePath("/reminders");
    revalidatePath("/");

    return { success: true, logId: log.id };
  } catch (error: any) {
    console.error("addServiceLogAction error:", error);
    return { success: false, error: error.message || "Gagal mencatat log servis" };
  }
}
