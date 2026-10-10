export interface ParsedReceiptResult {
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  occurredOn: string; // YYYY-MM-DD
  description: string;
  merchantOrParty?: string;
  sourceBank?: string;
  categoryHint?: string;
  matchedWalletId?: string;
  matchedCategoryId?: string;
  rawSummary?: string;
}

interface HouseholdContext {
  wallets: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; kind?: string }>;
}

/**
 * Parsing teks receipt jika yang dishare adalah teks (misal copy-paste struk atau share teks myBCA)
 */
export function parseReceiptText(text: string, context?: HouseholdContext): ParsedReceiptResult | null {
  if (!text || text.trim().length === 0) return null;

  const cleanText = text.trim();

  // 1. Ekstrak nominal (contoh: "Rp 150.000", "Rp150.000,00", "Rp. 50.000", "Total: 150000")
  let amount = 0;
  const nominalRegex = /(?:rp\.?|nominal|jumlah|total|sebesar)\s*[:]?\s*([0-9.,]+)/i;
  const nominalMatch = cleanText.match(nominalRegex);
  if (nominalMatch) {
    const rawNum = nominalMatch[1].replace(/,00$/, "").replace(/\./g, "").replace(/,/g, "");
    amount = parseInt(rawNum, 10) || 0;
  }

  // 2. Ekstrak tanggal (contoh: "10/10/2026", "10 Okt 2026", "2026-10-10")
  let occurredOn = new Date().toISOString().split("T")[0];
  const dateRegex = /(\d{1,2})[\/\-\s]([A-Za-z]+|\d{1,2})[\/\-\s](\d{4})/;
  const dateMatch = cleanText.match(dateRegex);
  if (dateMatch) {
    // jika berhasil parse tanggal sederhana
    try {
      const parsedDate = new Date(dateMatch[0]);
      if (!isNaN(parsedDate.getTime())) {
        occurredOn = parsedDate.toISOString().split("T")[0];
      }
    } catch {
      // fallback hari ini
    }
  }

  // 3. Ekstrak penerima / tujuan / merchant
  let merchant = "";
  const toMatch = /(?:ke|tujuan|penerima|merchant|nama)\s*[:]?\s*([^\n\r]+)/i.exec(cleanText);
  if (toMatch) {
    merchant = toMatch[1].trim();
  }

  // 4. Deteksi tipe
  let type: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE";
  if (/transfer masuk|terima uang|income/i.test(cleanText)) {
    type = "INCOME";
  } else if (/antar rekening sendiri|pindah dana/i.test(cleanText)) {
    type = "TRANSFER";
  }

  // Keterangan
  const description = merchant ? `Pembayaran ke ${merchant}` : "Transaksi myBCA";

  // Matching dompet & kategori
  let matchedWalletId: string | undefined;
  let matchedCategoryId: string | undefined;

  if (context) {
    const bcaWallet = context.wallets.find((w) => /bca/i.test(w.name));
    if (bcaWallet) matchedWalletId = bcaWallet.id;
    else if (context.wallets.length > 0) matchedWalletId = context.wallets[0].id;

    // match kategori belanja/makanan
    const matchCat = context.categories.find((c) =>
      /belanja|pakaian|baju|makan|kebutuhan|lainnya/i.test(c.name)
    );
    if (matchCat) matchedCategoryId = matchCat.id;
  }

  return {
    type,
    amount,
    occurredOn,
    description,
    merchantOrParty: merchant,
    sourceBank: "BCA",
    matchedWalletId,
    matchedCategoryId,
    rawSummary: cleanText.substring(0, 100),
  };
}

/**
 * Analisis gambar bukti pembayaran (myBCA, QRIS, struk transfer) menggunakan Google Gemini API (Free Tier).
 */
export async function parseReceiptWithGemini(
  imageBuffer: Buffer,
  mimeType: string,
  context?: HouseholdContext
): Promise<{ success: boolean; data?: ParsedReceiptResult; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error:
        "GEMINI_API_KEY belum dikonfigurasi di environment (.env). Anda bisa mendapatkan API Key 100% gratis di Google AI Studio (https://aistudio.google.com) tanpa perlu kartu kredit.",
    };
  }

  try {
    const base64Data = imageBuffer.toString("base64");

    const categoriesList = (context?.categories || []).map((c) => c.name).join(", ");
    const walletsList = (context?.wallets || []).map((w) => w.name).join(", ");

    const systemPrompt = `Anda adalah asisten AI pencatat keuangan rumah tangga Indonesia yang sangat teliti.
Tugas Anda adalah membaca gambar bukti transfer / struk pembayaran / bukti QRIS (seperti myBCA, BCA Mobile, QRIS, Livin Mandiri, GoPay, ShopeePay, OVO, struk toko).

Format keluaran WAJIB berupa JSON murni dengan skema berikut:
{
  "type": "EXPENSE" | "INCOME" | "TRANSFER",
  "amount": <number bulat rupiah tanpa titik/koma, contoh 150000>,
  "occurredOn": "<tanggal format YYYY-MM-DD, jika tahun tidak ada gunakan tahun ini>",
  "merchantOrParty": "<nama toko / penerima transfer / merchant QRIS, contoh: Uniqlo, Toko Baju XYZ, PT ABC>",
  "note": "<deskripsi singkat yang informatif, contoh: Pembelian baju di Uniqlo>",
  "sourceBank": "<nama bank sumber atau e-wallet, contoh: BCA, Mandiri, GoPay>",
  "suggestedCategory": "<kategori yang paling cocok dari daftar kategori berikut: ${categoriesList || "Bahan Makanan, Makan Luar, Pakaian, Belanja Rumah, Hiburan, Utilitas, Lainnya"}>",
  "suggestedWallet": "<dompet yang paling cocok dari daftar dompet berikut: ${walletsList || "Kas Tunai, BCA Bersama, GoPay"}>"
}

PANDUAN TAMBAHAN:
1. myBCA sering bertuliskan "BERHASIL", "TRANSFER BERHASIL", "PEMBAYARAN QRIS BERHASIL", atau "BUKTI TRANSAKSI".
2. Pastikan nominal akurat. Jika tertulis "Rp 249.000,00", ambil angka 249000.
3. Jika ini adalah pembelian barang (misal baju, makanan, kopi), tentukan type "EXPENSE".
4. Hanya kembalikan string JSON valid tanpa markdown backticks tambahan.`;

    // Coba model Gemini Flash aktif dengan fallback berurutan
    const preferredModel = process.env.GEMINI_MODEL;
    const models = [
      preferredModel,
      "gemini-3-flash-preview",
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.7-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
    ].filter(Boolean) as string[];
    let rawResponseText = "";
    let lastError = "";

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    {
                      inline_data: {
                        mime_type: mimeType || "image/jpeg",
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.1,
              },
            }),
          }
        );

        if (!response.ok) {
          const errBody = await response.text();
          lastError = `Model ${model} error (${response.status}): ${errBody}`;
          continue;
        }

        const resJson = await response.json();
        const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          rawResponseText = candidateText;
          break;
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }

    if (!rawResponseText) {
      return {
        success: false,
        error: `Gagal memproses gambar bukti bayar dengan Gemini API: ${lastError}`,
      };
    }

    // Parse JSON
    let parsed: any;
    try {
      const cleanJson = rawResponseText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      return {
        success: false,
        error: "Gagal memproses format data hasil analisis AI.",
      };
    }

    const amount = typeof parsed.amount === "number" ? Math.round(parsed.amount) : parseInt(String(parsed.amount || 0).replace(/\D/g, ""), 10) || 0;
    const occurredOn = parsed.occurredOn || new Date().toISOString().split("T")[0];
    const type = ["EXPENSE", "INCOME", "TRANSFER"].includes(parsed.type) ? parsed.type : "EXPENSE";
    const description = parsed.note || (parsed.merchantOrParty ? `Pembayaran ke ${parsed.merchantOrParty}` : "Transaksi myBCA");

    // Match Wallet
    let matchedWalletId: string | undefined;
    if (context && context.wallets.length > 0) {
      // 1. Cek kecocokan nama dompet dari AI
      if (parsed.suggestedWallet) {
        const exact = context.wallets.find((w) =>
          w.name.toLowerCase().includes(parsed.suggestedWallet.toLowerCase())
        );
        if (exact) matchedWalletId = exact.id;
      }
      // 2. Cek kecocokan nama bank sumber (contoh "BCA")
      if (!matchedWalletId && parsed.sourceBank) {
        const bankMatch = context.wallets.find((w) =>
          w.name.toLowerCase().includes(parsed.sourceBank.toLowerCase())
        );
        if (bankMatch) matchedWalletId = bankMatch.id;
      }
      // 3. Fallback dompet pertama jika belum ketemu
      if (!matchedWalletId) {
        matchedWalletId = context.wallets[0].id;
      }
    }

    // Match Category
    let matchedCategoryId: string | undefined;
    if (context && context.categories.length > 0) {
      if (parsed.suggestedCategory) {
        const catMatch = context.categories.find((c) =>
          c.name.toLowerCase().includes(parsed.suggestedCategory.toLowerCase()) ||
          parsed.suggestedCategory.toLowerCase().includes(c.name.toLowerCase())
        );
        if (catMatch) matchedCategoryId = catMatch.id;
      }
      if (!matchedCategoryId) {
        // Coba cari kategori belanja atau umum
        const defaultCat = context.categories.find((c) =>
          /belanja|pakaian|makan|lainnya/i.test(c.name)
        );
        matchedCategoryId = defaultCat?.id || context.categories[0].id;
      }
    }

    return {
      success: true,
      data: {
        type,
        amount,
        occurredOn,
        description,
        merchantOrParty: parsed.merchantOrParty,
        sourceBank: parsed.sourceBank,
        categoryHint: parsed.suggestedCategory,
        matchedWalletId,
        matchedCategoryId,
        rawSummary: rawResponseText,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Terjadi kendala saat menganalisis bukti bayar: ${err.message || String(err)}`,
    };
  }
}
