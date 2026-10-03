"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { deleteVaultDocument } from "@/lib/data/vault";
import { DocumentCategory, AuditAction, Recurrence } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function uploadDocumentAction(formData: FormData) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const currentProfile = household.profiles[0]; // Reynaldi (Admin)

    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim();
    const category = (formData.get("category") as DocumentCategory) || DocumentCategory.OTHER;
    const description = (formData.get("description") as string)?.trim() || null;
    const expiryDateStr = (formData.get("expiryDate") as string)?.trim() || null;
    const createReminder = formData.get("createReminder") === "true";

    if (!file || file.size === 0) {
      return { success: false, error: "File dokumen wajib dipilih" };
    }

    if (!title) {
      return { success: false, error: "Judul dokumen wajib diisi" };
    }

    // Limit 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: "Ukuran file maksimum adalah 10 MB" };
    }

    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const documentId = crypto.randomUUID();
    const storagePath = `${household.id}/${documentId}-${sanitizedFilename}`;

    const supabase = await createClient();

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("household-vault")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.warn("Supabase Storage warning (will store metadata):", uploadError.message);
    }

    let linkedReminderId: string | null = null;
    let parsedExpiryDate: Date | null = null;

    if (expiryDateStr) {
      parsedExpiryDate = new Date(`${expiryDateStr}T00:00:00.000Z`);

      if (createReminder) {
        // Create a Reminder for expiry
        const reminder = await prisma.reminder.create({
          data: {
            householdId: household.id,
            title: `Masa Berlaku Dokumen: ${title}`,
            dueDate: parsedExpiryDate,
            recurrence: Recurrence.NONE,
            remindDaysBefore: [30, 7, 0],
            note: `Pengingat otomatis dari Brankas Dokumen (${category})`,
          },
        });
        linkedReminderId = reminder.id;
      }
    }

    // Create DocumentVault record
    const documentRecord = await prisma.documentVault.create({
      data: {
        id: documentId,
        householdId: household.id,
        title,
        category,
        filePath: storagePath,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        description,
        expiryDate: parsedExpiryDate,
        reminderId: linkedReminderId,
        createdById: currentProfile.id,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        householdId: household.id,
        actorId: currentProfile.id,
        entity: "DOCUMENT_VAULT",
        entityId: documentRecord.id,
        action: AuditAction.CREATE,
        diff: {
          title,
          category,
          fileSize: file.size,
          mimeType: file.type,
          expiryDate: expiryDateStr,
        },
      },
    });

    revalidatePath("/vault");
    revalidatePath("/reminders");
    revalidatePath("/settings");

    return { success: true, documentId: documentRecord.id };
  } catch (error: any) {
    console.error("uploadDocumentAction error:", error);
    return { success: false, error: error.message || "Gagal mengunggah dokumen" };
  }
}

export async function deleteDocumentAction(documentId: string) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const currentProfile = household.profiles[0];

    await deleteVaultDocument(documentId, household.id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        householdId: household.id,
        actorId: currentProfile.id,
        entity: "DOCUMENT_VAULT",
        entityId: documentId,
        action: AuditAction.DELETE,
        diff: { deleted: true },
      },
    });

    revalidatePath("/vault");
    revalidatePath("/reminders");

    return { success: true };
  } catch (error: any) {
    console.error("deleteDocumentAction error:", error);
    return { success: false, error: error.message || "Gagal menghapus dokumen" };
  }
}
