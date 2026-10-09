import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { getBudgetsWithSpent } from "@/lib/data/budgets";
import { getBillsForHousehold } from "@/lib/data/bills";

export const dynamic = "force-dynamic";

function escapeCsvCell(cell: any): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function generateCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const rowLines = rows.map((r) => r.map(escapeCsvCell).join(","));
  // Include UTF-8 BOM for Microsoft Excel compatibility
  return "\uFEFF" + [headerLine, ...rowLines].join("\r\n");
}

export async function GET(request: NextRequest) {
  try {
    const household = await getOrCreateDefaultHousehold();
    const type = request.nextUrl.searchParams.get("type") || "transactions";
    const today = new Date().toISOString().slice(0, 10);

    let csvContent = "";
    let filename = `omahku-${type}-${today}.csv`;

    if (type === "budgets") {
      const budgetSummary = await getBudgetsWithSpent(household.id);
      const headers = [
        "Periode",
        "Kategori",
        "Limit Nominal",
        "Realisasi Pengeluaran",
        "Sisa Anggaran",
        "Persentase Terpakai",
        "Status",
      ];
      const rows = budgetSummary.categories.map((c) => [
        budgetSummary.periodFormatted,
        c.categoryName,
        c.limit,
        c.spent,
        c.remaining,
        `${c.percentage}%`,
        c.status === "EXCEEDED"
          ? "Melebihi Limit"
          : c.status === "WARNING"
          ? "Waspada"
          : c.status === "SAFE"
          ? "Aman"
          : "Tanpa Limit",
      ]);
      csvContent = generateCsv(headers, rows);
    } else if (type === "bills") {
      const bills = await getBillsForHousehold(household.id);
      const headers = [
        "Nama Tagihan",
        "Nominal (Rp)",
        "Frekuensi",
        "Hari Jatuh Tempo",
        "Status Siklus Ini",
        "Tenggat Jatuh Tempo",
        "Kategori",
      ];
      const rows = bills.map((b) => [
        b.name,
        b.amount,
        b.period === "MONTHLY" ? "Bulanan" : "Tahunan",
        b.dueDay,
        b.isPaidThisCycle ? "Lunas" : "Belum Bayar",
        b.dueDateFormatted,
        b.categoryName,
      ]);
      csvContent = generateCsv(headers, rows);
    } else {
      // Default: transactions
      filename = `omahku-transaksi-${today}.csv`;
      const transactions = await prisma.transaction.findMany({
        where: { householdId: household.id, deletedAt: null },
        orderBy: { occurredOn: "desc" },
        include: {
          wallet: true,
          toWallet: true,
          category: true,
          createdBy: true,
        },
      });

      const headers = [
        "ID",
        "Tanggal",
        "Waktu",
        "Tipe",
        "Nominal (Rp)",
        "Kategori",
        "Dompet Asal",
        "Dompet Tujuan",
        "Catatan",
        "Dicatat Oleh",
      ];

      const rows = transactions.map((t) => [
        t.id,
        t.occurredOn.toISOString().slice(0, 10),
        t.occurredOn.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        t.type === "EXPENSE" ? "Pengeluaran" : t.type === "INCOME" ? "Pemasukan" : "Transfer",
        Number(t.amount),
        t.category?.name || "Umum",
        t.wallet.name,
        t.toWallet?.name || "-",
        t.note || "",
        t.createdBy.displayName,
      ]);

      csvContent = generateCsv(headers, rows);
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[CSV Export Error]", err);
    return new Response(`Gagal menghasilkan CSV: ${err.message}`, { status: 500 });
  }
}
