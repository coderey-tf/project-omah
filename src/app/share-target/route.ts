import { NextRequest, NextResponse } from "next/server";
import { parseReceiptWithGemini, parseReceiptText } from "@/lib/ai/receipt-parser";
import { getOrCreateDefaultHousehold } from "@/lib/data/households";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/transactions", request.url), 303);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Field names specified in manifest.ts share_target
    const file = (formData.get("receipt") || formData.get("file") || formData.get("files")) as File | null;
    const text = (formData.get("text") || formData.get("title") || formData.get("url")) as string | null;

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
      console.warn("[Share Target] Could not load household context:", e);
    }

    const redirectUrl = new URL("/transactions", request.url);

    // 1. Jika menerima file gambar
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || "image/jpeg";

      const parsed = await parseReceiptWithGemini(buffer, mimeType, householdContext);

      if (parsed.success && parsed.data) {
        redirectUrl.searchParams.set("sharedReceipt", JSON.stringify(parsed.data));
      } else {
        redirectUrl.searchParams.set("shareError", parsed.error || "Gagal memproses gambar bukti bayar");
      }
      return NextResponse.redirect(redirectUrl, 303);
    }

    // 2. Jika menerima teks dari menu share
    if (text && text.trim().length > 0) {
      const parsedText = parseReceiptText(text, householdContext);
      if (parsedText) {
        redirectUrl.searchParams.set("sharedReceipt", JSON.stringify(parsedText));
      } else {
        redirectUrl.searchParams.set("shareError", "Format teks bukti transaksi tidak dikenali");
      }
      return NextResponse.redirect(redirectUrl, 303);
    }

    // Jika kosong
    redirectUrl.searchParams.set("shareError", "Tidak ada file bukti pembayaran yang diterima dari share menu.");
    return NextResponse.redirect(redirectUrl, 303);
  } catch (error: any) {
    console.error("[Share Target POST Error]", error);
    const redirectUrl = new URL("/transactions", request.url);
    redirectUrl.searchParams.set("shareError", error.message || "Terjadi kendala saat menerima share");
    return NextResponse.redirect(redirectUrl, 303);
  }
}
