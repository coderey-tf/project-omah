import { NextRequest, NextResponse } from "next/server";
import { parseReceiptWithGemini, parseReceiptText } from "@/lib/ai/receipt-parser";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const text = formData.get("text") as string | null;

    // Ambil data dompet dan kategori household aktif untuk konteks pencocokan
    let householdContext = {
      wallets: [] as Array<{ id: string; name: string }>,
      categories: [] as Array<{ id: string; name: string; kind?: string }>,
    };

    try {
      const household = await getOrCreateDefaultHousehold();
      if (household) {
        const wallets = await prisma.wallet.findMany({
          where: { householdId: household.id, deletedAt: null },
          select: { id: true, name: true },
        });
        const categories = await prisma.category.findMany({
          where: { householdId: household.id, isArchived: false },
          select: { id: true, name: true, kind: true },
        });
        householdContext = { wallets, categories };
      }
    } catch (e) {
      console.warn("[Receipt Scan API] Could not load household context:", e);
    }

    // Jika yang dikirim adalah teks (misal copy-paste struk atau share text)
    if (text && (!file || file.size === 0)) {
      const parsedText = parseReceiptText(text, householdContext);
      if (parsedText) {
        return NextResponse.json({ success: true, data: parsedText });
      }
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada file bukti pembayaran yang diunggah" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";

    const result = await parseReceiptWithGemini(buffer, mimeType, householdContext);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("[Receipt Scan Route Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses struk" },
      { status: 500 }
    );
  }
}
