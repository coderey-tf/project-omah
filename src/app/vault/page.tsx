import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { VaultView } from "@/components/vault/vault-view";
import { getVaultDocuments } from "@/lib/data/vault";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Brankas Dokumen — Omahku",
  description: "Penyimpanan salinan digital privat dan aman untuk dokumen penting keluarga.",
};

export default async function VaultPage() {
  const household = await getOrCreateDefaultHousehold();
  const documents = await getVaultDocuments(household.id);

  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar />

      {/* 2. Top Header Bar */}
      <Header householdName={household.name} />

      {/* 3. Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        <VaultView initialDocuments={documents} />
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
