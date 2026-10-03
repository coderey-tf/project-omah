import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "./households";

export async function getShoppingPageData() {
  const household = await getOrCreateDefaultHousehold();
  const householdId = household.id;

  // Find or create default shopping list
  let shoppingList = await prisma.shoppingList.findFirst({
    where: { householdId, isArchived: false },
    include: {
      items: {
        orderBy: [{ checked: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!shoppingList) {
    shoppingList = await prisma.shoppingList.create({
      data: {
        householdId,
        name: "Kebutuhan Dapur & Mingguan",
      },
      include: {
        items: true,
      },
    });
  }

  const items = shoppingList.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity || "1",
    checked: item.checked,
    checkedAt: item.checkedAt?.toISOString() || null,
  }));

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return {
    householdName: household.name,
    listId: shoppingList.id,
    listName: shoppingList.name,
    items,
    checkedCount,
    totalCount,
    progressPercent,
  };
}
