import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { getTransactionsPageData } from "@/lib/data/transactions";

export const dynamic = "force-dynamic";

export default async function TransactionsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const initialSharedReceipt = typeof searchParams.sharedReceipt === "string" ? searchParams.sharedReceipt : undefined;
  const initialShareError = typeof searchParams.shareError === "string" ? searchParams.shareError : undefined;

  const data = await getTransactionsPageData();

  return (
    <div className="min-h-screen bg-canvas text-text-black flex flex-col md:pl-60">
      {/* 1. Desktop Sidebar */}
      <DesktopSidebar />

      {/* 2. Top Header Bar */}
      <Header householdName={data.householdName} />

      {/* 3. Main Content Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        <TransactionsView
          initialData={data}
          initialSharedReceipt={initialSharedReceipt}
          initialShareError={initialShareError}
        />
      </div>

      {/* 4. Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
