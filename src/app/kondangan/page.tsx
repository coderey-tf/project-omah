import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { KondanganView } from "@/components/kondangan/kondangan-view";
import { getKondanganRecords } from "@/lib/data/kondangan";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buku Kondangan & Angpao — Omahku",
  description: "Catatan timbal-balik amplop dan kado hajatan kerabat dan keluarga.",
};

export default async function KondanganPage() {
  const household = await getOrCreateDefaultHousehold();
  const { records, totalReceived, totalGiven } = await getKondanganRecords(household.id);

  // Fetch wallets with balance
  const wallets = await prisma.wallet.findMany({
    where: { householdId: household.id, deletedAt: null },
    include: {
      txFrom: { where: { deletedAt: null } },
      txTo: { where: { deletedAt: null } },
    },
  });

  const formattedWallets = wallets.map((w) => {
    let balance = Number(w.openingBalance);
    for (const tx of w.txFrom) {
      if (tx.type === "EXPENSE" || tx.type === "TRANSFER") {
        balance -= Number(tx.amount);
      } else if (tx.type === "INCOME") {
        balance += Number(tx.amount);
      }
    }
    for (const tx of w.txTo) {
      if (tx.type === "TRANSFER") {
        balance += Number(tx.amount);
      }
    }
    return {
      id: w.id,
      name: w.name,
      balance,
    };
  });

  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar />

      {/* 2. Top Header Bar */}
      <Header householdName={household.name} />

      {/* 3. Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        <KondanganView
          initialRecords={records}
          totalReceived={totalReceived}
          totalGiven={totalGiven}
          wallets={formattedWallets}
        />
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
