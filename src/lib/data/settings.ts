import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "./households";
import { getBillsForHousehold } from "./bills";

export async function getSettingsPageData() {
  const household = await getOrCreateDefaultHousehold();
  const householdId = household.id;

  // 1. Profiles with linked notification channels
  const profiles = await prisma.profile.findMany({
    where: { householdId },
    include: {
      channels: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // 2. Wallets with calculated balances
  const rawWallets = await prisma.wallet.findMany({
    where: { householdId, deletedAt: null },
    include: {
      txFrom: { where: { deletedAt: null }, select: { type: true, amount: true } },
      txTo: { where: { deletedAt: null }, select: { amount: true } },
    },
  });

  const wallets = rawWallets.map((w) => {
    let balance = Number(w.openingBalance);
    for (const t of w.txFrom) {
      if (t.type === "INCOME") balance += Number(t.amount);
      if (t.type === "EXPENSE") balance -= Number(t.amount);
      if (t.type === "TRANSFER") balance -= Number(t.amount);
    }
    for (const t of w.txTo) {
      balance += Number(t.amount);
    }
    return {
      id: w.id,
      name: w.name,
      type: w.type,
      balance,
    };
  });

  // 3. Bills
  const bills = await getBillsForHousehold(householdId);


  // 4. Categories
  const categories = await prisma.category.findMany({
    where: { householdId, isArchived: false },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });

  return {
    household: {
      id: household.id,
      name: household.name,
      periodStartDay: household.periodStartDay,
      icalToken: household.icalToken,
    },
    profiles: profiles.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      role: p.role,
      joinedAt: p.createdAt.toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      }),
      channels: p.channels.map((c) => ({
        id: c.id,
        channel: c.channel,
        address: c.address,
        isActive: c.isActive,
        linkCodeHash: c.linkCodeHash,
        linkCodeExpiresAt: c.linkCodeExpiresAt ? c.linkCodeExpiresAt.toISOString() : null,
        linkedAt: c.linkedAt ? c.linkedAt.toISOString() : null,
      })),
    })),
    wallets,
    bills,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      icon: c.icon,
    })),
  };
}
