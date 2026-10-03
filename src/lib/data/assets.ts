import { prisma } from "@/lib/prisma";
import { AssetType } from "@prisma/client";

export interface AssetItem {
  id: string;
  householdId: string;
  name: string;
  type: AssetType;
  brandModel: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  serialNumber: string | null;
  warrantyExpiry: string | null;
  licensePlate: string | null;
  currentMileage: number | null;
  note: string | null;
  createdAt: string;
  isWarrantyExpired?: boolean;
  daysToWarrantyExpiry?: number | null;
  serviceLogsCount: number;
  latestServiceDate?: string | null;
  nextServiceDueDate?: string | null;
  nextServiceMileage?: number | null;
}

export interface ServiceLogItem {
  id: string;
  assetId: string;
  assetName: string;
  householdId: string;
  serviceDate: string;
  mileage: number | null;
  serviceCenter: string | null;
  description: string;
  cost: number;
  transactionId: string | null;
  nextDueDate: string | null;
  nextMileage: number | null;
  createdAt: string;
}

export async function getAssets(
  householdId: string,
  typeFilter?: AssetType
): Promise<{
  assets: AssetItem[];
  totalValuation: number;
  warrantyExpiringSoonCount: number;
  totalAssetsCount: number;
}> {
  const whereClause: any = {
    householdId,
    deletedAt: null,
  };

  if (typeFilter) {
    whereClause.type = typeFilter;
  }

  const assets = await prisma.asset.findMany({
    where: whereClause,
    include: {
      serviceLogs: {
        orderBy: {
          serviceDate: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const now = new Date();
  let totalValuation = 0;
  let warrantyExpiringSoonCount = 0;

  const formatted: AssetItem[] = assets.map((asset) => {
    const priceNum = asset.purchasePrice ? Number(asset.purchasePrice) : null;
    if (priceNum) {
      totalValuation += priceNum;
    }

    let isWarrantyExpired = false;
    let daysToWarrantyExpiry: number | null = null;

    if (asset.warrantyExpiry) {
      const exp = new Date(asset.warrantyExpiry);
      const diffTime = exp.getTime() - now.getTime();
      daysToWarrantyExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isWarrantyExpired = daysToWarrantyExpiry <= 0;
      if (daysToWarrantyExpiry <= 30) {
        warrantyExpiringSoonCount++;
      }
    }

    const latestLog = asset.serviceLogs[0];

    return {
      id: asset.id,
      householdId: asset.householdId,
      name: asset.name,
      type: asset.type,
      brandModel: asset.brandModel,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split("T")[0] : null,
      purchasePrice: priceNum,
      serialNumber: asset.serialNumber,
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString().split("T")[0] : null,
      licensePlate: asset.licensePlate,
      currentMileage: asset.currentMileage,
      note: asset.note,
      createdAt: asset.createdAt.toISOString(),
      isWarrantyExpired,
      daysToWarrantyExpiry,
      serviceLogsCount: asset.serviceLogs.length,
      latestServiceDate: latestLog ? latestLog.serviceDate.toISOString().split("T")[0] : null,
      nextServiceDueDate: latestLog?.nextDueDate ? latestLog.nextDueDate.toISOString().split("T")[0] : null,
      nextServiceMileage: latestLog?.nextMileage || null,
    };
  });

  return {
    assets: formatted,
    totalValuation,
    warrantyExpiringSoonCount,
    totalAssetsCount: formatted.length,
  };
}

export async function getAssetWithLogs(id: string, householdId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id, householdId, deletedAt: null },
    include: {
      serviceLogs: {
        orderBy: { serviceDate: "desc" },
      },
    },
  });

  if (!asset) return null;

  return {
    ...asset,
    purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : null,
    purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split("T")[0] : null,
    warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.toISOString().split("T")[0] : null,
    serviceLogs: asset.serviceLogs.map((log) => ({
      ...log,
      cost: Number(log.cost),
      serviceDate: log.serviceDate.toISOString().split("T")[0],
      nextDueDate: log.nextDueDate ? log.nextDueDate.toISOString().split("T")[0] : null,
    })),
  };
}

export async function deleteAsset(id: string, householdId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id, householdId, deletedAt: null },
  });

  if (!asset) {
    throw new Error("Aset tidak ditemukan atau bukan milik household ini");
  }

  await prisma.asset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
}

export async function deleteServiceLog(id: string, householdId: string) {
  const log = await prisma.assetServiceLog.findFirst({
    where: { id, householdId },
  });

  if (!log) {
    throw new Error("Log servis tidak ditemukan");
  }

  await prisma.assetServiceLog.delete({
    where: { id },
  });

  return true;
}
