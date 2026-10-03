import { prisma } from "@/lib/prisma";
import { DocumentCategory } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

export interface VaultDocumentItem {
  id: string;
  householdId: string;
  title: string;
  category: DocumentCategory;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  expiryDate: string | null;
  reminderId: string | null;
  createdById: string;
  creatorName: string;
  createdAt: string;
  downloadUrl?: string;
  isExpired?: boolean;
  daysToExpiry?: number | null;
}

export async function getVaultDocuments(
  householdId: string,
  categoryFilter?: DocumentCategory
): Promise<VaultDocumentItem[]> {
  const whereClause: any = {
    householdId,
    deletedAt: null,
  };

  if (categoryFilter) {
    whereClause.category = categoryFilter;
  }

  const docs = await prisma.documentVault.findMany({
    where: whereClause,
    include: {
      createdBy: {
        select: {
          displayName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const now = new Date();
  const supabase = await createClient();

  const formatted: VaultDocumentItem[] = await Promise.all(
    docs.map(async (doc) => {
      let downloadUrl = "";
      try {
        const { data } = await supabase.storage
          .from("household-vault")
          .createSignedUrl(doc.filePath, 3600); // 1 hour signed URL
        if (data?.signedUrl) {
          downloadUrl = data.signedUrl;
        }
      } catch {
        // Fallback if storage not initialized
        downloadUrl = `/api/vault/download/${doc.id}`;
      }

      let isExpired = false;
      let daysToExpiry: number | null = null;

      if (doc.expiryDate) {
        const exp = new Date(doc.expiryDate);
        const diffTime = exp.getTime() - now.getTime();
        daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isExpired = daysToExpiry <= 0;
      }

      return {
        id: doc.id,
        householdId: doc.householdId,
        title: doc.title,
        category: doc.category,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        description: doc.description,
        expiryDate: doc.expiryDate ? doc.expiryDate.toISOString().split("T")[0] : null,
        reminderId: doc.reminderId,
        createdById: doc.createdById,
        creatorName: doc.createdBy.displayName,
        createdAt: doc.createdAt.toISOString(),
        downloadUrl: downloadUrl || undefined,
        isExpired,
        daysToExpiry,
      };
    })
  );

  return formatted;
}

export async function getVaultDocumentById(id: string, householdId: string) {
  return prisma.documentVault.findFirst({
    where: {
      id,
      householdId,
      deletedAt: null,
    },
    include: {
      createdBy: true,
      reminder: true,
    },
  });
}

export async function deleteVaultDocument(id: string, householdId: string) {
  const doc = await prisma.documentVault.findFirst({
    where: { id, householdId, deletedAt: null },
  });

  if (!doc) {
    throw new Error("Dokumen tidak ditemukan atau bukan milik household ini");
  }

  // Soft delete record
  await prisma.documentVault.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  // Also soft delete linked reminder if exists
  if (doc.reminderId) {
    await prisma.reminder.updateMany({
      where: { id: doc.reminderId, householdId },
      data: { deletedAt: new Date() },
    });
  }

  // Attempt to delete from Supabase storage
  try {
    const supabase = await createClient();
    await supabase.storage.from("household-vault").remove([doc.filePath]);
  } catch {
    // Ignore storage delete errors during soft-delete
  }

  return true;
}
